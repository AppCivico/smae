Como ainda estamos mudando bastante o esquema do banco de dados, ainda apago a pasta 'migrations' e começo do zero.

Mas por limitação do prisma, não tem como cadastrar triggers/extensões no arquivo de modelo, então precisa editar o SQL da migration
estou deixando o SQL da migration do emaildb separado aqui em forma de backup

Se continuar apresentando muito problema, vamos usar outro gerenciador de versões (https://sqitch.org/), apenas para o controle de versão,
e deixar o prisma apenas como ORM para gerar as classes com as tipagens certas - porem o sqitch no momento seria uma dependência extra no ambiente de prod