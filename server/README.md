# Usar redis

```bash
docker run --name redis-container -d -p 6379:6379 \
redis:latest redis-server --requirepass lab_ueb_redis@
```

- passs

````bash
auth lab_ueb_redis@```
````

-- in container redis

```bash
docker exec -it redis-container redis-cli
```
