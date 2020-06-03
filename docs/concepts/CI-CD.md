# CI/CD - Continuous integration and continuous delivery

The following guide provides instructions how to use `ask cli` in CI/CD environment (Jenkins, Travis, Github Actions, etc).

1) Set up the following environment variables:
 - AWS_ACCESS_KEY_ID
 - AWS_SECRET_ACCESS_KEY
 - ASK_REFRESH_TOKEN or ASK_ACCESS_TOKEN
 - ASK_VENDOR_ID

Values for ASK_REFRESH_TOKEN and ASK_ACCESS_TOKEN can be created using the following command:
```
ask util generate-lwa-tokens
```
or ASK_REFRESH_TOKEN, ASK_ACCESS_TOKEN and ASK_VENDOR_ID can be copied from $HOME/.ask/cli_config after running
```
ask configure
```

2) Add profile __ENVIRONMENT_ASK_PROFILE__ to ask-resources.json
```
{
  "askcliResourcesVersion": "2020-03-31",
  "profiles": {
    "__ENVIRONMENT_ASK_PROFILE__": {
      "skillMetadata": {
        "src": "./skill-package"
      },
      "code": {
        "default": {
          "src": "./lambda"
        }
      },
    ...
    }
  }
}

```