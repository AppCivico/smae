#!/bin/bash

rsync -av $HOME/projetos/appcivico/sepep_geoloc/api/* $HOME/projetos/appcivico/smae/backend-geoloc/
rsync -av $HOME/projetos/appcivico/sepep_geoloc/.gitignore $HOME/projetos/appcivico/smae/backend-geoloc/
rsync -av $HOME/projetos/appcivico/sepep_geoloc/LICENSE $HOME/projetos/appcivico/smae/backend-geoloc/
rsync -av $HOME/projetos/appcivico/sepep_geoloc/README.md $HOME/projetos/appcivico/smae/backend-geoloc/
rsync -av $HOME/projetos/appcivico/sepep_geoloc/.env.* $HOME/projetos/appcivico/smae/backend-geoloc/
#cp ./backend-geoloc-requirements.txt $HOME/projetos/appcivico/smae/backend-geoloc/

rm -f $HOME/projetos/appcivico/smae/backend-geoloc/windows_requirements.txt
