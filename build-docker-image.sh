#!/bin/bash
AWS_ACCESS_KEY_ID=$2
AWS_SECRET_ACCESS_KEY=$3

echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
env_dev="dev"
env_uat="uat"
env_prod="prod"
if [ "$env_dev" == "$1" ]
	then
		APP_NAME=auth-api-dev
		S3_BUCKET=appe-dev-docker-bucket
elif [ "$env_uat" == "$1" ] && [ "v1" == "$6" ]
	then
		APP_NAME=auth-api-v1-uat
		S3_BUCKET=appe-uat-docker-bucket	
elif [ "$env_uat" == "$1" ] && [ "v2" == "$6" ]
	then
		APP_NAME=auth-api-v2-uat
		S3_BUCKET=appe-uat-docker-bucket
elif [ "$env_prod" == "$1" ] && [ "v1" == "$6" ]
	then
		APP_NAME=auth-api-v1-prod
		S3_BUCKET=appe-prod-docker-bucket
elif [ "$env_prod" == "$1" ] && [ "v2" == "$6" ]
	then
		APP_NAME=auth-api-v2-prod
		S3_BUCKET=appe-prod-docker-bucket
fi

ECS_REPOSITORY=012177264511.dkr.ecr.us-east-1.amazonaws.com/use1apecrpe
TAG=$APP_NAME-$4-$5
buildnumber=$5
echo $buildnumber
DOCKER_IMAGE_NAME=$ECS_REPOSITORY:$TAG
sudo docker build -t $DOCKER_IMAGE_NAME --build-arg env=$1 .

echo 'Logging into AWS Docker'
sudo $(aws ecr get-login --region us-east-1)
echo "Pushing new image $DOCKER_IMAGE_NAME to ECR"
sudo docker push ${DOCKER_IMAGE_NAME}

DOCKERJSON=$(sed -e 's|{{TAG}}|'"$TAG"'|g' dockerrun.aws.tpl)
echo ${DOCKERJSON} > Dockerrun.aws.json
cat Dockerrun.aws.json
zip $TAG.zip Dockerrun.aws.json
zip $APP_NAME-latest.zip Dockerrun.aws.json

aws s3 cp $TAG.zip s3://$S3_BUCKET/$TAG.zip
aws s3 cp $APP_NAME-latest.zip s3://$S3_BUCKET/$APP_NAME-latest.zip
#create and push to 2 zip to s3
#1 versioned and 1 latest