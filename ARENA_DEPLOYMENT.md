# Arena Battle System Deployment Guide

## Local Development

### 1. Start the BattleService (WebSocket Server)

```bash
cd BattleService
npm install
npm start
```

The service will run on `http://localhost:8080`

### 2. Start the Main Application

```bash
npm install
npm run dev
```

The application will run on `http://localhost:3000`

## Deploying BattleService to Render

### 1. Create a new Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `your-app-battle-service`
   - **Environment**: `Node`
   - **Build Command**: `cd BattleService && npm install`
   - **Start Command**: `cd BattleService && npm start`
   - **Instance Type**: Free tier (or higher for production)

### 2. Environment Variables

Add these environment variables in Render:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-production-jwt-secret-here
```

Note: Render automatically sets the PORT, but you can override it.

### 3. Update Frontend Configuration

After deploying to Render, update the WebSocket URL in your frontend:

In `components/WebSocketArenaComponent.js`, line ~55:

```javascript
const wsUrl = process.env.NODE_ENV === 'production' 
  ? 'wss://your-app-battle-service.onrender.com'  // Replace with your Render URL
  : 'ws://localhost:8080';
```

### 4. Deploy Main App to Vercel

Your main Next.js app can still be deployed to Vercel:

```bash
vercel --prod
```

Add environment variables to Vercel:
- `JWT_SECRET` (same as BattleService)
- `MONGODB_URI`
- `NEXT_PUBLIC_WEBSOCKET_URL=wss://your-app-battle-service.onrender.com`

## Features Implemented

### ✅ Skills System
- 16 diverse skills with different types (attack, defense, heal, special, buff)
- Each skill has power, cooldown, element, and visual effects
- Skills include: Fireball, Lightning Bolt, Ice Shard, Shadow Strike, Holy Smite, Poison Dart, Earth Spike, Wind Slash, Shield Wall, Dodge Roll, Iron Defense, Magic Barrier, Healing Potion, Regeneration, Quick Heal, Divine Light

### ✅ Skill Selection UI
- Visual skill selector with filtering by type
- Supports selecting exactly 4 skills
- Shows skill details including power, cooldown, and description
- Saves selected skills to localStorage

### ✅ Arena System
- **PvP Mode**: Real-time battles against other players
- **PvE Mode**: Battles against AI with difficulty levels (easy, normal, hard, random)
- Real-time matchmaking queue
- WebSocket-based communication for instant updates

### ✅ Battle Mechanics
- Turn-based combat with skill cooldowns
- Health/damage system
- Real-time battle log
- Win/loss conditions with XP rewards
- AI opponents with intelligent skill usage

### ✅ WebSocket Integration
- Persistent connection with reconnection logic
- Real-time battle updates
- Matchmaking queue management
- Error handling and connection status

### ✅ User Interface
- Modern, responsive design with dark mode support
- Animated transitions using Framer Motion
- Battle progress indicators
- Skill cooldown timers
- Battle result screens with XP gained

## API Endpoints

### Arena API (`/api/arena`)
- `POST`: Join arena queue or create battle
- Handles both PvP and PvE battle creation

### WebSocket Events

#### Client → Server
- `join_arena`: Join matchmaking queue
- `battle_action`: Use skill or forfeit
- `leave_arena`: Leave current battle
- `ping`: Connection health check

#### Server → Client
- `battle_ready`: Battle found and ready to start
- `battle_update`: Real-time battle state updates
- `matchmaking`: Queue status updates
- `pong`: Health check response
- `error`: Error messages

## Testing the System

1. **Local Testing**:
   - Start both services locally
   - Open multiple browser tabs to test PvP
   - Test PvE battles against AI

2. **Production Testing**:
   - Deploy BattleService to Render
   - Update WebSocket URL in frontend
   - Deploy frontend to Vercel
   - Test real-time battles

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**:
   - Check if BattleService is running
   - Verify WebSocket URL is correct
   - Check firewall settings

2. **Skills Not Loading**:
   - Verify skills.js is imported correctly
   - Check browser console for errors

3. **Battle Not Starting**:
   - Check JWT token validity
   - Verify user authentication
   - Check WebSocket connection status

### Production Considerations

1. **Scaling**: Use Redis for session management when scaling beyond single instance
2. **Security**: Implement rate limiting and input validation
3. **Monitoring**: Add logging and error tracking (e.g., Sentry)
4. **Database**: Consider using MongoDB Atlas for production database
5. **SSL/TLS**: Ensure HTTPS/WSS in production

## Future Enhancements

- Spectator mode for watching battles
- Tournament brackets
- Skill progression and unlocking
- Battle replays
- Leaderboards and rankings
- Guild battles and team modes
