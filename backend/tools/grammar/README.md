Instale a lib JISON

    npm install jison -g

E então compile o script de grammar

    jison formula_parser.jison

Copie o arquivo formula_parser.js para a pasta publica (é usado tbm no frontend)

    cp formula_parser.js  ../../src/public/js/

