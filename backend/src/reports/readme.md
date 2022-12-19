## Relatório Anual e Semestral:

Parâmetros:

- periodo: anual, Semestral, required
- ano: padrão = ano corrente
- mes: padrão = 1 no anual
- semestre: 'primeiro' ou 'segundo', no semestral, padrão 'primeiro'
- tipo: consolidado/analítico, padrão=consolidado
- series: padrão são todas - {Realizado + Acumulado, Planejado + Acumulado}

Filtros:

- tags das metas
- indicadores/ini/atividade
- código contains indicadores/ini/atividade
- titulo contains indicadores/ini/atividade

Serão exportando apenas os dados vindo da *SerieIndicadores* (já calculado)

com os dados na *SerieIndicadores*, se o indicador for bimensal, então no banco tem algo como:

    serie=Realizado, data-valor 2020-01 = 1
    serie=Realizado, data-valor 2020-03 = 2
    serie=Realizado, data-valor 2020-05 = {sem valor}
    serie=Realizado, data-valor 2020-07 = 3
    serie=Realizado, data-valor 2020-09 = 4
    serie=Realizado, data-valor 2020-11 = 5
    serie=Realizado, data-valor 2021-01 = 6
    serie=Realizado, data-valor 2020-03 = 8

pra relatório periodo=anual, ano=2020, Series=Realizado, tipo **Analítico** voltaria no CSV:

    meta,ini,ativ,serie,data,valor
    1,1.1,1.1.2,Realizado,2020-01,1
    1,1.1,1.1.2,Realizado,2020-02,1
    1,1.1,1.1.2,Realizado,2020-03,1
    1,1.1,1.1.2,Realizado,2020-04,2
    1,1.1,1.1.2,Realizado,2020-05,-
    1,1.1,1.1.2,Realizado,2020-06,-
    1,1.1,1.1.2,Realizado,2020-07,3
    1,1.1,1.1.2,Realizado,2020-08,3
    1,1.1,1.1.2,Realizado,2020-09,4
    1,1.1,1.1.2,Realizado,2020-10,4
    1,1.1,1.1.2,Realizado,2020-11,5
    1,1.1,1.1.2,Realizado,2020-12,5

> Pensar se deve ou não voltar os meses em branco, eu acho que sim, já que o analítico estaria se baseando primeiro no periodo e depois tentando cruzar os dados pela data, e não buscando primeiros os dados

Como é analítico e anual, volta só o periodo de 12 meses pra frente do mês do input (padrão 1, se passar 2 vai começar e acabar em feb)

Então seguindo a mesma logica acima com o ano de 2021:

periodo=anual, ano=2021, Series=Realizado, tipo **Analítico** voltaria no CSV:

    meta,ini,ativ,serie,data,valor
    1,1.1,1.1.2,Realizado,2021-01,6
    1,1.1,1.1.2,Realizado,2021-02,6
    1,1.1,1.1.2,Realizado,2021-03,8
    1,1.1,1.1.2,Realizado,2021-04,8
    1,1.1,1.1.2,Realizado,2021-05,-
    1,1.1,1.1.2,Realizado,2021-06,-
    1,1.1,1.1.2,Realizado,2021-07,-
    1,1.1,1.1.2,Realizado,2021-08,-
    1,1.1,1.1.2,Realizado,2021-09,-
    1,1.1,1.1.2,Realizado,2021-10,-
    1,1.1,1.1.2,Realizado,2021-11,-
    1,1.1,1.1.2,Realizado,2021-12,-


Agora considerando que o tipo é o **consolidado**:

pra relatório periodo=anual, ano=2021, Series=Realizado, tipo=Consolidado voltaria no CSV:

    meta,ini,ativ,serie,data,valor
    1,1.1,1.1.2,Realizado,2020,6
    1,1.1,1.1.2,Realizado,2021,8

nesse caso, ao calcular o consolidado pra 2021 (que só tinha um valor em março, mas como é ainda dentro do ano de 2021, ta valendo como resultado pra esse ano, certo?!)
e então subtrai 12 meses pra fazer a mesma coisa no ano

## semestral

No caso do semestral **consolidado** é sempre o semestre e o semestre anterior,
então se passar que semestre=segundo, ano=2021, vai usar como base pra conta,

segundo-semestre = data_valor >= 2021-07-01 até < 2021-01-01
primeiro-semestre = data_valor >= 2021-01-01 até < 2021-07-01

a saida do CSV seria algo como:

    meta,ini,ativ,serie,data,valor
    1,1.1,1.1.2,Realizado,2021-01/2021-06,8
    1,1.1,1.1.2,Realizado,2021-07/2021-12,-


Se utilizar semestral **analítico**

semestre=segundo, ano=2021, vai trazer os meses

    2021-07-01,
    2021-08-01,
    2021-09-01,
    2021-10-01,
    2021-11-01,
    2021-12-01

semestre=primeiro, ano=2021, vai trazer os meses

    2021-01-01,
    2021-02-01,
    2021-03-01,
    2021-04-01,
    2021-05-01,
    2021-06-01

> Da pra gente pensar em usar o parâmetro 'mes' para empurrar essa conta do 'inicio' semestre, mas o padrão seria 0 (ignorar) nesse caso

