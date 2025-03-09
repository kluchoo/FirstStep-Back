#! /usr/bin/env bash


pnpm i

docker pull postgres
docker network create FirstStep
docker run -d --name FirstStep --network FirstStep -e POSTGRES_PASSWORD=secret postgres
npx prisma generate
