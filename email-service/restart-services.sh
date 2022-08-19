#!/bin/bash

ps aux|grep -v grep| grep script/process-emails.pl| awk '{print $2}' | xargs kill
