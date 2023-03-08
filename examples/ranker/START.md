
# Ranker Board

![Ranker Board](/images/screenshots/ranker.png "Ranker Board")

# Install

## Linux & Ubuntu guide

Install python and virtualenv

```bash
# install python and virtualenv
apt install python3.6
pip3 install virtualenv

# setup python virtual environment
virtualenv -p python3 env3
source env3/bin/activate

# install requirements
cd backend
pip install -r requirements.txt
```

# Start

Rank Results using 1 or multiple columns

```bash
python server.py -c config.json -l ../examples/named_entity/config.xml -i ../examples/ranker/tasks.json -o output
```
