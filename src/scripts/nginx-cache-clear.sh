#!/bin/bash
# Script to clear NGINX cache
# Usage: chmod +x nginx-cache-clear.sh && sudo ./nginx-cache-clear.sh

echo "Checking for NGINX cache..."

# Check if NGINX is running
if ! systemctl is-active --quiet nginx; then
  echo "NGINX is not running."
  exit 0
fi

# Check for common NGINX cache directories
CACHE_DIRS=(
  "/var/cache/nginx"
  "/var/www/cache"
  "/usr/local/nginx/cache"
  "/etc/nginx/cache"
)

FOUND_CACHE=0

for DIR in "${CACHE_DIRS[@]}"; do
  if [ -d "$DIR" ]; then
    echo "Found cache directory: $DIR"
    FOUND_CACHE=1
    
    echo "Clearing cache in $DIR..."
    rm -rf "$DIR"/*
    
    # Recreate directory structure if needed
    mkdir -p "$DIR"
    
    echo "✅ Cache cleared in $DIR"
  fi
done

# Check for proxy_cache_path directives in NGINX config
CACHE_PATHS=$(grep -r "proxy_cache_path" /etc/nginx/ | awk '{print $2}' | sort | uniq)

if [ -n "$CACHE_PATHS" ]; then
  echo "Found additional cache paths in NGINX config:"
  
  IFS=$'\n'
  for PATH in $CACHE_PATHS; do
    if [ -d "$PATH" ]; then
      echo "Clearing cache in $PATH..."
      rm -rf "$PATH"/*
      
      # Recreate directory structure if needed
      mkdir -p "$PATH"
      
      echo "✅ Cache cleared in $PATH"
      FOUND_CACHE=1
    fi
  done
fi

if [ $FOUND_CACHE -eq 0 ]; then
  echo "No NGINX cache directories found."
else
  echo "Restarting NGINX to apply changes..."
  systemctl restart nginx
  
  if [ $? -eq 0 ]; then
    echo "✅ NGINX restarted successfully!"
  else
    echo "❌ Failed to restart NGINX. Please check logs."
  fi
fi

# Test NGINX caching settings
echo "Testing NGINX caching settings..."
curl -I -H "Cache-Control: no-cache" http://localhost | grep -i cache

echo "✅ NGINX cache management completed." 