#!/bin/bash

APP_NAME=Auth-API

TAG=$APP_NAME-${TAG}

S3_BUCKET=appe-swagger-bucket

#--------------------------------------

npm run swagger

cd dist/src/swagger

ls 

cat swagger.json

echo 'Logging into AWS Docker'
sudo $(aws ecr get-login --region us-east-1)

aws s3 cp swagger.json s3://$S3_BUCKET/$APP_NAME-latest-swagger.json
aws s3 cp swagger.json s3://$S3_BUCKET/$TAG-swagger.json