# Dockerfile for building the Electron app using electronuserland/builder (includes Wine/NSIS)
# Usage (from project root where this Dockerfile lives):
# 1) Build the builder image (this caches npm install):
#    docker build -t daa-electron-builder .
# 2) Run the container to execute the build and copy artifacts to host ./dist:
#    docker run --rm -v "%cd%/dist:/project/dist" daa-electron-builder
# The container's default command runs npx electron-builder --win --x64 --publish never

FROM electronuserland/builder:wine

# Create app directory
WORKDIR /project

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies (unsafe-perm to allow postinstall scripts inside container)
RUN npm ci --unsafe-perm --no-optional

# Copy the rest of the project
COPY . .

# Ensure dist dir exists and can be mounted by the host
RUN mkdir -p /project/dist
VOLUME ["/project/dist"]

# Do not publish by default; build windows x64 artifacts when container runs
CMD ["bash","-lc","npx electron-builder --win --x64 --publish never"]
