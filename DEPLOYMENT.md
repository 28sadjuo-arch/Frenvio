# SocialHub - Deployment Guide

Complete guide to deploy SocialHub to production platforms.

## Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Build completes without errors
- [ ] Database migrations applied
- [ ] All features tested locally
- [ ] Performance optimized
- [ ] Security policies reviewed
- [ ] Error handling implemented

## Production Build

```bash
npm run build
```

Creates optimized bundle in `dist/` directory:
- CSS: 19.66 KB (4.07 KB gzipped)
- JS: 866.93 KB (239.24 KB gzipped)
- Total: ~900 KB

## Deployment Options

### Option 1: Vercel (Recommended)

**Pros**: Zero-config, automatic deployments, free tier available

1. Push code to GitHub
2. Connect Vercel to repository
3. Set environment variables:
   ```
   VITE_SUPABASE_URL=xxx
   VITE_SUPABASE_ANON_KEY=xxx
   ```
4. Deploy automatically on push

**Manual Deploy**:
```bash
npm i -g vercel
vercel
```

### Option 2: Netlify

**Pros**: Easy setup, preview deployments, continuous deployment

1. Push code to GitHub
2. Connect Netlify to repository
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables
5. Deploy

**Manual Deploy**:
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### Option 3: Railway

**Pros**: Simple, affordable, Docker support

1. Connect GitHub repository
2. Create new project
3. Set environment variables
4. Configure build:
   - Build command: `npm run build`
   - Start command: `npm run preview`
5. Deploy

### Option 4: Render

**Pros**: Good free tier, auto-deploys

1. Push to GitHub
2. Create new static site on Render
3. Connect repository
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Deploy

### Option 5: Self-Hosted / Docker

**Using Docker**:

1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Create `nginx.conf`:
```nginx
events {
  worker_connections 1024;
}

http {
  mime_types {
    text/html html;
    text/css css;
    application/javascript js;
  }

  server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
      try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }
  }
}
```

3. Build and run:
```bash
docker build -t socialhub .
docker run -p 80:80 socialhub
```

4. Deploy to:
   - AWS ECS
   - Google Cloud Run
   - Azure Container Instances
   - DigitalOcean App Platform
   - Fly.io

## Environment Variables

Create `.env.production` with:
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

**Never commit secrets!** Use platform-specific secret management.

## Performance Optimization

### Caching Strategy

1. **Static Assets** (1 year):
   ```
   /assets/*.js
   /assets/*.css
   ```

2. **HTML** (No cache):
   ```
   /index.html
   ```

3. **API Responses** (5 minutes):
   - Supabase queries cached

### Image Optimization

- Use Supabase Storage for images
- Implement image compression
- Use WebP format where supported
- Lazy load images

### Code Optimization

Already implemented:
- Minified CSS and JS
- Tree-shaking removes unused code
- Dynamic imports for routes
- Efficient bundling

### Monitoring

Set up monitoring with:
- Sentry (error tracking)
- LogRocket (session replay)
- Vercel Analytics (performance)
- Google Analytics (usage)

## Security Considerations

### HTTPS
- All deployments must use HTTPS
- Redirect HTTP to HTTPS
- Use security headers:
  ```
  Strict-Transport-Security: max-age=31536000
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'
  ```

### Environment Variables
- Never expose secrets in code
- Use platform secret management
- Rotate keys regularly
- Monitor unauthorized access

### CORS
- Restrict CORS to your domain
- Use preflight requests
- Validate origins

### Rate Limiting
- Implement rate limits on API
- Prevent brute force attacks
- Monitor suspicious activity

## Database Considerations

### Backups
- Supabase provides automatic backups
- Configure backup retention
- Test restore procedures
- Export data regularly

### Scaling
- Monitor connection pool
- Optimize slow queries
- Add database indexes
- Consider read replicas

### Monitoring
- Check database performance
- Monitor query logs
- Alert on errors
- Track usage metrics

## Post-Deployment

### Verification Checklist
- [ ] Site loads correctly
- [ ] Auth works (signup/login)
- [ ] Friend discovery functions
- [ ] Reviews display
- [ ] Dark/light mode toggles
- [ ] 3D background renders
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security headers set

### Monitoring Setup
1. Set up error tracking (Sentry)
2. Configure analytics (GA4)
3. Monitor performance (Vercel/Netlify)
4. Set up alerts for errors
5. Monitor Supabase metrics

### Health Checks
- Weekly: Test all features
- Bi-weekly: Check performance metrics
- Monthly: Review security logs
- Quarterly: Full security audit

## Troubleshooting

### Build Fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Blank White Page
1. Check browser console for errors
2. Verify environment variables
3. Check Supabase connection
4. Review network tab
5. Clear browser cache

### 3D Background Not Showing
1. Check WebGL support
2. Verify Three.js loaded
3. Check browser console
4. Test in different browser

### Performance Issues
1. Check bundle size
2. Monitor database queries
3. Review network waterfalls
4. Check for memory leaks
5. Optimize assets

### Real-time Updates Slow
1. Check Supabase connection
2. Verify RLS policies
3. Monitor database load
4. Check network latency
5. Consider caching layer

## Scaling Strategy

### Phase 1 (0-1000 users)
- Single deployment
- Supabase free tier
- Basic monitoring
- No caching layer needed

### Phase 2 (1000-10000 users)
- Monitor performance
- Consider scaling database
- Implement caching (Redis)
- Monitor Supabase usage

### Phase 3 (10000+ users)
- Multi-region deployment
- Database read replicas
- Advanced caching
- CDN for static assets
- Load balancing
- Consider dedicated infrastructure

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review security logs weekly
- Check backup integrity weekly
- Monitor performance metrics daily
- Respond to alerts immediately

### Deployment Frequency
- Hotfixes: immediate
- Bug fixes: daily/weekly
- Features: weekly/bi-weekly
- Major releases: monthly

### Version Control
- Tag all deployments
- Maintain release notes
- Test in staging first
- Plan rollback procedure

## Cost Optimization

### Supabase
- Free tier: up to 500MB database
- Monitor usage regularly
- Archive old data
- Use appropriate indexes

### Hosting (Vercel/Netlify)
- Free tier: sufficient for hobby projects
- Pro tier: for production
- Monitor bandwidth usage
- Cache aggressively

### CDN
- Consider Cloudflare (free)
- Cache static assets globally
- Reduce origin requests

## Disaster Recovery

### Backup Strategy
1. Daily automated Supabase backups
2. Weekly full data export
3. Monthly backup verification
4. Documented restore procedure

### Incident Response
1. Monitor for issues continuously
2. Alert on anomalies
3. Documented runbook
4. Quick rollback capability
5. Post-incident analysis

---

Ready to take your app to production? Choose your platform and deploy! 🚀
