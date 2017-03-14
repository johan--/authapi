{
 "AWSEBDockerrunVersion": 2,
 "containerDefinitions": [
   {
     "name": "Auth-API-Dev",
     "image": "012177264511.dkr.ecr.us-east-1.amazonaws.com/use1apecrpe:{{TAG}}",
     "essential": true,
     "memory": 12288,
     "portMappings": [
       {
         "hostPort": 8200,
         "containerPort": 3000
       }
     ]
   }
 ]
}



