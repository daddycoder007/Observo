import express from 'express';
import { getCollection } from '../database/mongoClient.js';

const router = express.Router();

// GET /api/logs - Get logs with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      level,
      service,
      host,
      startDate,
      endDate,
      startTime,
      endTime,
      search,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    const collection = getCollection();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter query
    const filter = {};
    
    if (level) {
      filter.level = { $regex: level, $options: 'i' };
    }
    
    if (service) {
      filter.service = { $regex: service, $options: 'i' };
    }
    
    if (host) {
      filter['metadata.host'] = { $regex: host, $options: 'i' };
    }
    
    if (startDate || endDate || startTime || endTime) {
      filter.timestamp = {};
      const start = startDate || startTime;
      const end = endDate || endTime;
      if (start) {
        filter.timestamp.$gte = new Date(start);
      }
      if (end) {
        filter.timestamp.$lte = new Date(end);
      }
    }
    
    if (search) {
      filter.$or = [
        { message: { $regex: search, $options: 'i' } },
        { service: { $regex: search, $options: 'i' } },
        { 'metadata.host': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const logs = await collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // Get total count for pagination
    const total = await collection.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        level,
        service,
        host,
        startDate,
        endDate,
        startTime,
        endTime,
        search
      }
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// GET /api/logs/stats - Get log statistics for dashboard
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
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

    // Get total logs count
    const totalLogs = await collection.countDocuments(dateFilter);

    // Get logs by level
    const logsByLevel = await collection.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // Get logs by service
    const logsByService = await collection.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Get logs by host
    const logsByHost = await collection.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$metadata.host', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Get recent logs (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = await collection.countDocuments({
      timestamp: { $gte: last24Hours }
    });

    // Get logs per hour for the last 24 hours
    const logsPerHour = await collection.aggregate([
      {
        $match: {
          timestamp: { $gte: last24Hours }
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
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
      }
    ]).toArray();

    res.json({
      totalLogs,
      recentLogs,
      logsByLevel,
      logsByService,
      logsByHost,
      logsPerHour,
      timeRange: {
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Error fetching log statistics:', error);
    res.status(500).json({ error: 'Failed to fetch log statistics' });
  }
});

// GET /api/logs/:id - Get a specific log by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const collection = getCollection();

    const log = await collection.findOne({ _id: id });

    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json(log);

  } catch (error) {
    console.error('Error fetching log:', error);
    res.status(500).json({ error: 'Failed to fetch log' });
  }
});

// DELETE /api/logs - Delete logs with optional filtering
router.delete('/', async (req, res) => {
  try {
    const { level, service, host, startDate, endDate } = req.query;
    const collection = getCollection();

    // Build filter query (same as GET endpoint)
    const filter = {};
    
    if (level) {
      filter.level = { $regex: level, $options: 'i' };
    }
    
    if (service) {
      filter.service = { $regex: service, $options: 'i' };
    }
    
    if (host) {
      filter['metadata.host'] = { $regex: host, $options: 'i' };
    }
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    const result = await collection.deleteMany(filter);

    res.json({
      message: `Deleted ${result.deletedCount} logs`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting logs:', error);
    res.status(500).json({ error: 'Failed to delete logs' });
  }
});

export { router as logRoutes }; 