# Observo Dashboard

A modern, dark-themed log observability dashboard built with React and Material-UI.

## Features

### 🎯 Dashboard Overview
- **Real-time Statistics**: Total logs, recent logs, errors, and warnings
- **Interactive Charts**: Logs per hour timeline and log levels distribution
- **Service Analytics**: Top services and log levels breakdown
- **Auto-refresh**: Updates every 30 seconds

### 📊 Logs Viewer
- **Advanced Filtering**: Filter by level, service, host, date range, and search
- **Pagination**: Navigate through large log datasets
- **Detailed View**: Click to view complete log details
- **Real-time Data**: Live log data from your Observo server

### 🎨 Modern UI/UX
- **Dark Theme**: Easy on the eyes with beautiful gradients
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Interactive Elements**: Hover effects, loading states, and smooth animations
- **Professional Layout**: Clean, organized interface

## Tech Stack

- **React 18** with TypeScript
- **Material-UI (MUI)** for components and theming
- **Recharts** for data visualization
- **Axios** for API communication
- **React Router** for navigation
- **Date-fns** for date formatting

## Getting Started

### Prerequisites
- Node.js 16+ 
- Your Observo server running on `http://localhost:3000`

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Open your browser**:
   Navigate to `http://localhost:3001`

### Build for Production

```bash
npm run build
```

## API Integration

The dashboard connects to your Observo server API endpoints:

- `GET /api/logs` - Fetch logs with filtering and pagination
- `GET /api/logs/stats` - Get dashboard statistics
- `GET /api/logs/:id` - Get specific log details

## Configuration

### API Base URL
Update the API base URL in `src/services/api.ts` if your server runs on a different port:

```typescript
const API_BASE_URL = 'http://localhost:3000/api';
```

### Theme Customization
Modify the dark theme in `src/App.tsx`:

```typescript
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff', // Your primary color
    },
    // ... other theme options
  },
});
```

## Features in Detail

### Dashboard Components

1. **Statistics Cards**
   - Total logs count
   - Recent logs (last 24 hours)
   - Error count with red highlighting
   - Warning count with yellow highlighting

2. **Charts**
   - **Line Chart**: Logs per hour for the last 24 hours
   - **Pie Chart**: Log levels distribution
   - **Service Rankings**: Top 5 services by log volume
   - **Level Breakdown**: Detailed log level statistics

3. **Logs Viewer**
   - **Advanced Filters**: Multiple filter options
   - **Search**: Full-text search in log messages
   - **Date Range**: Filter by specific time periods
   - **Pagination**: Handle large datasets efficiently
   - **Detail Modal**: View complete log information

### Color Scheme

- **Primary**: `#00d4ff` (Cyan)
- **Secondary**: `#ff6b35` (Orange)
- **Error**: `#ff4757` (Red)
- **Warning**: `#ffd700` (Yellow)
- **Info**: `#2ed573` (Green)
- **Debug**: `#00d4ff` (Cyan)

## Troubleshooting

### Common Issues

1. **Connection Error**
   - Ensure your Observo server is running on port 3000
   - Check CORS settings in your server

2. **No Data Displayed**
   - Verify your server has log data
   - Check browser console for API errors

3. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## Development

### Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx      # Main dashboard view
│   ├── LogsViewer.tsx     # Logs table and filters
│   └── Sidebar.tsx        # Navigation sidebar
├── services/
│   └── api.ts            # API service layer
├── App.tsx               # Main app with routing
└── index.tsx             # App entry point
```

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **API Endpoints**: Extend `src/services/api.ts`
3. **Routes**: Add to `src/App.tsx`
4. **Styling**: Use Material-UI's `sx` prop or create custom themes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

---

**Observo Dashboard** - Modern log observability for modern applications 🚀
