docker rm some-redis --force
timeout 10 
docker run --name some-redis -d -p 6379:6379 redis