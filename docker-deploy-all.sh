#!/bin/bash
set -e

# Builds and deploys all images for the Azure environments

ORG=${ORG:-hsldevcom}

for TAG in dev stage production; do
  DOCKER_IMAGE=$ORG/hsl-route-map-poc:${TAG}

  docker build --build-arg BUILD_ENV=${TAG} -t $DOCKER_IMAGE .
  docker push $DOCKER_IMAGE
done
