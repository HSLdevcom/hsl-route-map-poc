#!/bin/bash

set -e

ORG=${ORG:-hsldevcom}

read -p "Tag: " TAG

DOCKER_TAG=${TAG:-production}
DOCKER_IMAGE=$ORG/hsl-route-map-poc:${DOCKER_TAG}

docker build --build-arg BUILD_ENV=${TAG:-production} -t $DOCKER_IMAGE .
docker push $DOCKER_IMAGE
