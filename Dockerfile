FROM node:19-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json .
RUN npm install 

# Bundle app source 
COPY . . 

 # Expose port 3000 for react vite project 
EXPOSE 5000

 # Run the react vite project when the container launches 
CMD ["node", "app.js"]