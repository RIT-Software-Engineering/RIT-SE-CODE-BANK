### * After copying and renaming _sample.conf_ be sure to replace values with those corresponding to your app name (e.g. _toddler-project.conf_)
### as well as any _this-apps-name.conf_ references below
### with your actual app name 
### Then remove this line and anything above

# How to use

## Setup

On the server put `this-apps-name.conf` in the servers `/etc/nginx/conf.d` directory.

## Useful nginx commands

### Check that updates to this-apps-name.conf are valid

sudo nginx -t

### Reload nginx after updating this-apps-name.conf

sudo systemctl reload nginx