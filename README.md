# 🎯 Queue Management System

A modern, real-time queue management system built with React, TypeScript, and Supabase.

**🌐 Live Demo**: https://queuemanagementsystem1.netlify.app

## ✨ Features

### 🚀 Currently Available
- ✅ **User Authentication** - Secure login/signup with Supabase Auth
- ✅ **Queue Management** - Create and manage multiple queues
- ✅ **Token System** - Add people to queues with position tracking
- ✅ **Real-time Updates** - Live queue updates using Supabase realtime
- ✅ **Serve/Cancel Tokens** - Manage queue flow efficiently
- ✅ **Mobile Responsive** - Works perfectly on all devices
- ✅ **Public Access** - Share your queue with customers

### 🔧 Coming Soon (Database Setup Required)
- 🔄 **Contact Information** - Store customer contact details
- 🔄 **Service Types** - Categorize services with estimated durations
- 🔄 **Priority Levels** - VIP, High, and Normal priority support
- 🔄 **Analytics Dashboard** - Wait times, service metrics, and insights
- 🔄 **Notifications** - SMS/Email notifications for customers
- 🔄 **Advanced Queue Controls** - Pause/resume, auto-serve settings

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Drag & Drop**: React DnD

## 🚀 Quick Start

### 🌐 Use the Live App (Recommended)
Just visit: **https://queuemanagementsystem1.netlify.app**
- No installation required
- Works on any device
- Start managing queues immediately!

### 💻 Local Development

#### Prerequisites
- Node.js 18+
- Supabase account (for database)

#### Installation

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
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
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

## 📖 How to Use

### 👨‍💼 For Queue Managers

1. **🔐 Sign up/Login**
   - Visit the app and create an account
   - Use your email and a secure password

2. **➕ Create a Queue**
   - Click "Create Queue"
   - Give it a descriptive name (e.g., "Customer Service", "Doctor's Office")
   - Add a description if needed

3. **👥 Add People to Queue**
   - Click "Add Person"
   - Enter the person's name
   - They'll automatically get the next position

4. **⚡ Manage the Queue**
   - **Serve**: Mark someone as being served
   - **Cancel**: Remove someone from the queue
   - **Reorder**: Drag and drop to change positions
   - **View**: See real-time queue status

5. **📊 Monitor Progress**
   - See total people waiting
   - Track average wait times
   - View queue history

### 👥 For Customers

- **Check Status**: View the public queue to see your position
- **Real-time Updates**: Watch your position update automatically
- **Mobile Friendly**: Check from any device

## 🌐 Deployment

### ✅ Already Deployed!
**Live App**: https://queuemanagementsystem1.netlify.app

### 🚀 Deploy Your Own Version

#### Option 1: Netlify (Recommended)
1. **Fork this repository** on GitHub
2. **Go to [netlify.com](https://netlify.com)**
3. **Connect your GitHub** and select your fork
4. **Add environment variables**:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. **Deploy!** - Automatic builds on every push

#### Option 2: Vercel
1. **Go to [vercel.com](https://vercel.com)**
2. **Import your GitHub repository**
3. **Add the same environment variables**
4. **Deploy!**

### 🔧 Environment Variables Required
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🎯 Use Cases

### Perfect For:
- **🏥 Medical Clinics** - Patient waiting rooms
- **🏪 Retail Stores** - Customer service counters
- **🍕 Restaurants** - Takeout order management
- **🏛️ Government Offices** - Public service queues
- **🎓 Educational Institutions** - Student services
- **💼 Business Services** - Client appointment management
- **🔧 Service Centers** - Repair and maintenance queues

## 🛠️ Troubleshooting

### Common Issues:

**❌ "Auth session missing" error**
- Solution: Sign out and sign back in

**❌ Can't see queues after login**
- Solution: Create a new queue first

**❌ Real-time updates not working**
- Solution: Refresh the page, check internet connection

**❌ Environment variables not working**
- Solution: Make sure variables start with `VITE_` and restart dev server

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- 🐛 **Bug Reports**: [Create an issue](https://github.com/gayathri-1911/Queue-Management-System/issues)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/gayathri-1911/Queue-Management-System/discussions)
- 📧 **Questions**: Check existing issues or create a new one

## 🙏 Acknowledgments

- **React Team** - For the amazing framework
- **Supabase** - For the incredible backend-as-a-service
- **Netlify** - For seamless deployment
- **Tailwind CSS** - For beautiful styling
- **Lucide React** - For clean icons

---

**🚀 Built with ❤️ using React, TypeScript, and Supabase**

**⭐ Star this repo if you found it helpful!**
