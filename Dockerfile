# This image will be based on the official nodejs docker image
FROM node:argon

ARG env=dev
ENV env $env

# Create The App Directory
RUN mkdir -p /home/auth-api/app

RUN echo "$env";

RUN if [ "$env" = 'prod' ]; then export NEW_RELIC_ENABLED=true; else export NEW_RELIC_ENABLED=false; fi

#Copy The Current Directory To This Directory
COPY ./ /home/auth-api/app

WORKDIR /home/auth-api/app

EXPOSE 3000

# The command to run our app when the container is run
CMD ["sh", "-c", "export NODE_ENV=$env &&  npm run server:$env"]