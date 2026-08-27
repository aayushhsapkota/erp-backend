FROM node:24-alpine

# All Nepali-date logic in this app relies on the process's local timezone
# matching Nepal Standard Time (fixed UTC+5:45, no DST).
ENV TZ=Asia/Kathmandu

# Default port when the host doesn't supply one. Non-privileged (>1024) so
# the non-root user below can actually bind it; app.js still honors $PORT
# if the host (e.g. Render) injects its own at runtime.
ENV PORT=5000

# Create app directory, owned by the image's built-in non-root "node" user
WORKDIR /app
RUN chown node:node /app

# Install app dependencies (npm ci requires the lockfile and installs
# exactly what's pinned there, instead of npm install's more permissive
# re-resolution)
COPY --chown=node:node package.json package-lock.json ./

# Run as a non-root user for the rest of the build and at runtime
USER node

RUN npm ci

# Bundle app source
COPY --chown=node:node . .

EXPOSE 5000

# Start the Express API server
CMD ["node", "app.js"]
