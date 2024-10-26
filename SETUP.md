
# Without docker

You need node.js to build this application:

```shell
npm install
npm run build
```

The content of the `build` folder can be deployed on any static file hoster.

# With docker

```shell
docker build -t spyfall .
docker run -it --rm -p8080:8080 spyfall
```

# Development

```shell
docker run -it --rm -v "$PWD:$PWD" -w "$PWD" node:alpine npm install

docker run -it --rm -v "$PWD:$PWD" -w "$PWD" -p8080:8080 node:alpine npm run dev -- --host 0.0.0.0 --port 8080

docker run -it --rm -v "$PWD:$PWD" -w "$PWD" node:alpine npm run build
```