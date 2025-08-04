# Queue Management System

A modern, real-time queue management system built with React, TypeScript, and Supabase.

## Features

### Core Features
- ✅ **User Authentication** - Secure login/signup with Supabase Auth
- ✅ **Queue Management** - Create and manage multiple queues
- ✅ **Token System** - Add people to queues with position tracking
- ✅ **Real-time Updates** - Live queue updates using Supabase realtime
- ✅ **Contact Information** - Store customer contact details
- ✅ **Service Types** - Categorize services with estimated durations
- ✅ **Priority Levels** - VIP, High, and Normal priority support

### Advanced Features
- ✅ **Queue Controls** - Pause/resume queues, auto-serve settings
- ✅ **Analytics Dashboard** - Wait times, service metrics, and insights
- ✅ **Notifications** - SMS/Email notifications for customers
- ✅ **Token Lookup** - Public interface for customers to check status
- ✅ **No-Show Tracking** - Mark and track no-show customers
- ✅ **Drag & Drop Reordering** - Manually reorder queue positions

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Drag & Drop**: React DnD

## Quick Start

### Prerequisites
- Node.js 18+ 
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gayathri-1911/Queue-Management-System.git
   cd Queue-Management-System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the migration script from `apply_missing_migrations.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## Database Setup

The application requires several database tables. Run the complete migration script in your Supabase SQL Editor:

```sql
-- See apply_missing_migrations.sql for the complete setup script
```

This will create:
- `queues` - Queue definitions and settings
- `tokens` - Customer tokens/tickets
- `queue_events` - Analytics and event tracking
- `service_types` - Service categorization
- `queue_settings` - Queue configuration
- `notifications` - Notification history

## Usage

### For Queue Managers

1. **Sign up/Login** with your email
2. **Create a Queue** - Give it a name and description
3. **Configure Settings** - Set up service types, priority levels, operating hours
4. **Add Customers** - Add people to the queue with their details
5. **Manage Queue** - Serve customers, handle no-shows, reorder as needed
6. **View Analytics** - Monitor wait times, service efficiency, and trends

### For Customers

1. **Token Lookup** - Check queue status using token ID
2. **Real-time Updates** - See current position and estimated wait time
3. **Notifications** - Receive SMS/email when it's almost your turn

## Deployment

### Deploy to Vercel

1. **Push to GitHub** (already done)
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy!

### Environment Variables for Production

```
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code comments

---

Built with ❤️ using React, TypeScript, and Supabase
