import express from 'express';
import { getCollection } from '../database/mongoClient.js';
import logger from '../logger.js';

const router = express.Router();

// GET /api/analytics/overview - Get comprehensive analytics overview
router.get('/overview', async (req, res) => {
  try {
    const { startDate, endDate, service, host } = req.query;
    const collection = getCollection();

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) {
        dateFilter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.timestamp.$lte = new Date(endDate);
      }
    }

    // Add service and host filters
    if (service) {
      dateFilter.service = { $regex: service, $options: 'i' };
    }
    if (host) {
      dateFilter['metadata.host'] = { $regex: host, $options: 'i' };
    }

    // Get total logs and recent logs
    const totalLogs = await collection.countDocuments(dateFilter);
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = await collection.countDocuments({
      ...dateFilter,
      timestamp: { $gte: last24Hours }
    });

    // Get logs by level with percentages
    const logsByLevel = await collection.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // Calculate percentages
    const levelStats = logsByLevel.map(level => ({
      ...level,
      percentage: totalLogs > 0 ? ((level.count / totalLogs) * 100).toFixed(2) : 0
    }));

    // Get error rate (error + fatal logs)
    const errorLogs = logsByLevel
      .filter(level => ['error', 'fatal', 'critical'].includes(level._id.toLowerCase()))
      .reduce((sum, level) => sum + level.count, 0);
    
    const errorRate = totalLogs > 0 ? ((errorLogs / totalLogs) * 100).toFixed(2) : 0;

    // Get logs by service with performance metrics
    const logsByService = await collection.aggregate([
      { $match: dateFilter },
      { 
        $group: { 
          _id: '$service', 
          count: { $sum: 1 },
          errorCount: {
            $sum: {
              $cond: [
                { $in: [{ $toLower: '$level' }, ['error', 'fatal', 'critical']] },
                1,
                0
              ]
            }
          }
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Calculate service performance metrics
    const serviceStats = logsByService.map(service => ({
      ...service,
      errorRate: service.count > 0 ? ((service.errorCount / service.count) * 100).toFixed(2) : 0
    }));

    // Get hourly trends for the last 7 days
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const hourlyTrends = await collection.aggregate([
      {
        $match: {
          ...dateFilter,
          timestamp: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
            hour: { $hour: '$timestamp' }
          },
          count: { $sum: 1 },
          errorCount: {
            $sum: {
              $cond: [
                { $in: [{ $toLower: '$level' }, ['error', 'fatal', 'critical']] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
      }
    ]).toArray();

    // Get top hosts by log volume
    const logsByHost = await collection.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$metadata.host', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    res.json({
      summary: {
        totalLogs,
        recentLogs,
        errorRate: parseFloat(errorRate),
        averageLogsPerHour: totalLogs > 0 ? (totalLogs / 24).toFixed(2) : 0
      },
      logsByLevel: levelStats,
      logsByService: serviceStats,
      logsByHost,
      hourlyTrends,
      timeRange: {
        startDate,
        endDate
      }
    });

  } catch (error) {
    logger.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// GET /api/analytics/performance - Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { startDate, endDate, service } = req.query;
    const collection = getCollection();

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) {
        dateFilter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.timestamp.$lte = new Date(endDate);
      }
    }

    if (service) {
      dateFilter.service = { $regex: service, $options: 'i' };
    }

    // Get response time metrics (if available in metadata) - simplified without $percentile
    const responseTimeStats = await collection.aggregate([
      { $match: { ...dateFilter, 'metadata.responseTime': { $exists: true } } },
      {
        $group: {
          _id: '$service',
          avgResponseTime: { $avg: '$metadata.responseTime' },
          minResponseTime: { $min: '$metadata.responseTime' },
          maxResponseTime: { $max: '$metadata.responseTime' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgResponseTime: -1 } }
    ]).toArray();

    // Calculate p95 manually for each service
    const responseTimeStatsWithP95 = await Promise.all(
      responseTimeStats.map(async (stat) => {
        const responseTimes = await collection.aggregate([
          { 
            $match: { 
              ...dateFilter, 
              service: stat._id,
              'metadata.responseTime': { $exists: true } 
            } 
          },
          { $sort: { 'metadata.responseTime': 1 } },
          { $project: { responseTime: '$metadata.responseTime' } }
        ]).toArray();

        const sortedTimes = responseTimes.map(r => r.responseTime).sort((a, b) => a - b);
        const p95Index = Math.floor(sortedTimes.length * 0.95);
        const p95ResponseTime = sortedTimes[p95Index] || 0;

        return {
          ...stat,
          p95ResponseTime
        };
      })
    );

    // Get throughput metrics (logs per minute)
    const throughputStats = await collection.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            service: '$service',
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
            hour: { $hour: '$timestamp' },
            minute: { $minute: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.service',
          avgThroughput: { $avg: '$count' },
          maxThroughput: { $max: '$count' },
          minThroughput: { $min: '$count' }
        }
      },
      { $sort: { avgThroughput: -1 } }
    ]).toArray();

    // Get error patterns
    const errorPatterns = await collection.aggregate([
      {
        $match: {
          ...dateFilter,
          level: { $in: ['error', 'fatal', 'critical'] }
        }
      },
      {
        $group: {
          _id: {
            service: '$service',
            hour: { $hour: '$timestamp' }
          },
          errorCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.service',
          errorPattern: {
            $push: {
              hour: '$_id.hour',
              errorCount: '$errorCount'
            }
          },
          totalErrors: { $sum: '$errorCount' }
        }
      },
      { $sort: { totalErrors: -1 } }
    ]).toArray();

    res.json({
      responseTimeStats: responseTimeStatsWithP95,
      throughputStats,
      errorPatterns,
      timeRange: { startDate, endDate }
    });

  } catch (error) {
    logger.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// GET /api/analytics/trends - Get trend analysis
router.get('/trends', async (req, res) => {
  try {
    const { startDate, endDate, interval = 'hour' } = req.query;
    const collection = getCollection();

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) {
        dateFilter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.timestamp.$lte = new Date(endDate);
      }
    }

    // Build group by object based on interval
    let groupBy = {};
    switch (interval) {
      case 'minute':
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' },
          minute: { $minute: '$timestamp' }
        };
        break;
      case 'hour':
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        };
        break;
      case 'day':
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
        break;
      default:
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        };
    }

    // Get trends by level
    const trendsByLevel = await collection.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            ...groupBy,
            level: '$level'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day',
            hour: '$_id.hour',
            minute: '$_id.minute'
          },
          levels: {
            $push: {
              level: '$_id.level',
              count: '$count'
            }
          },
          totalCount: { $sum: '$count' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1, '_id.minute': 1 }
      }
    ]).toArray();

    // Get trends by service
    const trendsByService = await collection.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            ...groupBy,
            service: '$service'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day',
            hour: '$_id.hour',
            minute: '$_id.minute'
          },
          services: {
            $push: {
              service: '$_id.service',
              count: '$count'
            }
          },
          totalCount: { $sum: '$count' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1, '_id.minute': 1 }
      }
    ]).toArray();

    res.json({
      trendsByLevel,
      trendsByService,
      interval,
      timeRange: { startDate, endDate }
    });

  } catch (error) {
    logger.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// GET /api/analytics/anomalies - Get anomaly detection
router.get('/anomalies', async (req, res) => {
  try {
    const { startDate, endDate, threshold = 2 } = req.query;
    const collection = getCollection();

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) {
        dateFilter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.timestamp.$lte = new Date(endDate);
      }
    }

    // Get hourly log counts for anomaly detection
    const hourlyLogs = await collection.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
            hour: { $hour: '$timestamp' }
          },
          count: { $sum: 1 },
          errorCount: {
            $sum: {
              $cond: [
                { $in: [{ $toLower: '$level' }, ['error', 'fatal', 'critical']] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
      }
    ]).toArray();

    // Simple anomaly detection based on standard deviation
    const counts = hourlyLogs.map(h => h.count);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);
    const thresholdValue = mean + (parseFloat(threshold) * stdDev);

    // Identify anomalies
    const anomalies = hourlyLogs
      .filter(h => h.count > thresholdValue)
      .map(h => ({
        ...h,
        timestamp: new Date(h._id.year, h._id.month - 1, h._id.day, h._id.hour),
        deviation: ((h.count - mean) / stdDev).toFixed(2),
        severity: h.count > mean + (3 * stdDev) ? 'high' : 'medium'
      }));

    // Get error rate anomalies
    const errorRates = hourlyLogs
      .filter(h => h.count > 0)
      .map(h => ({
        ...h,
        errorRate: (h.errorCount / h.count) * 100
      }));

    const errorRateMean = errorRates.reduce((a, b) => a + b.errorRate, 0) / errorRates.length;
    const errorRateVariance = errorRates.reduce((a, b) => a + Math.pow(b.errorRate - errorRateMean, 2), 0) / errorRates.length;
    const errorRateStdDev = Math.sqrt(errorRateVariance);
    const errorRateThreshold = errorRateMean + (parseFloat(threshold) * errorRateStdDev);

    const errorAnomalies = errorRates
      .filter(h => h.errorRate > errorRateThreshold)
      .map(h => ({
        ...h,
        timestamp: new Date(h._id.year, h._id.month - 1, h._id.day, h._id.hour),
        deviation: ((h.errorRate - errorRateMean) / errorRateStdDev).toFixed(2),
        severity: h.errorRate > errorRateMean + (3 * errorRateStdDev) ? 'high' : 'medium'
      }));

    res.json({
      volumeAnomalies: anomalies,
      errorRateAnomalies: errorAnomalies,
      statistics: {
        mean,
        stdDev,
        threshold: thresholdValue,
        errorRateMean,
        errorRateStdDev,
        errorRateThreshold
      },
      timeRange: { startDate, endDate }
    });

  } catch (error) {
    logger.error('Error detecting anomalies:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

export { router as analyticsRoutes }; 