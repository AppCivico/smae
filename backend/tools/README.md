# instala system deps, eg:

    sudo apt install libgd-dev cpanminus


# instala perl deps

    cpanm -n DBIx::Class::Schema::Loader SQL::Translator


# atualizar o esquema gerado case o banco tenha mudado

    perl dump_schema.pl

# gerar os gráficos

    perl render.pl

