#!/bin/bash
for d in * ; do
    if [ -d "$d" ]; then
        cd "$d"
        pwd;
        ls -lhas;
        zip -9 $d.zip *
        mv $d.zip ..
        cd ..
        rm $d/*
        rmdir $d
    fi
done
