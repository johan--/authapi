{
  "AWSEBDockerrunVersion": 2,
  "volumes": [
    {
      "name": "application",
      "host": {
        "sourcePath": "/var/log/tandf"
      }
    }
  ] ,
  "containerDefinitions": [
    {
      "name": "Auth-API-Dev",
      "image": "012177264511.dkr.ecr.us-east-1.amazonaws.com/use1apecrpe:{{TAG}}",
      "essential": true,
      "memory": 11264,
      "portMappings": [
        {
          "hostPort": 8200,
          "containerPort": 3000
        }
      ],
      "mountPoints": [
        {
          "sourceVolume": "application",
          "containerPath": "/var/log/tandf"
        }
      ]
    },
    {
      "name": "filebeat",
      "image": "012177264511.dkr.ecr.us-east-1.amazonaws.com/filebeats:filebeat-latest",
      "essential": true,
      "memory": 1024,
      "mountPoints": [
        {
          "sourceVolume": "application",
          "containerPath": "/var/log/tandf",
          "readOnly": true
        }
      ]
    }
  ]
}



