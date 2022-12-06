import os
import subprocess


def run_server():
    
    atual = os.path.abspath('.')
    try:
        root = os.path.abspath(os.path.join('..', '..'))
        os.chdir(root)
        bash_docker_server = os.path.join(root, 'start_docker.sh')
        with open("data/output.log", "a") as output:
                subprocess.call(bash_docker_server, shell=True, stdout=output, stderr=output)
    finally:
        os.chdir(atual)