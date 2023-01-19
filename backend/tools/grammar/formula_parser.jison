
/* description: Parses and executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
[0-9]+("."[0-9]+)?\b  return 'NUMBER'
\$\_[0-9]{1,8}\b      return 'VARIABLE'
"*"                   return '*'
"/"                   return '/'
"-"                   return '-'
"+"                   return '+'
"^"                   return '^'
","                   return ','
"("                   return '('
")"                   return ')'
"PI"                  return 'FUNC0'
"FACTORIAL("           return 'FACTORIAL'
(ABS|LN|FLOOR|CEIL|EXP)\(  return 'FUNC1'
(LOG|DIV|MOD|NULLIF|POWER|ROUND)\(   return 'FUNC2'
<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

/* operator associations and precedence */

%left '+' '-'
%left '*' '/'
%left '^'
%left 'FUNC1'
%left 'FUNC2'
%left 'FACTORIAL'
%right '%'
%left UMINUS

%start expressions

%% /* language grammar */

expressions
    : e EOF
        { typeof console !== 'undefined' ? console.log($1) : print($1);
          return $1; }
    ;

e
    : e '+' e
        {$$ = $1 + " + "+ $3;}
    | e '-' e
        {$$ = $1 + "- " + $3;}
    | e '*' e
        {$$ = $1 + " * " + $3;}
    | e '/' e
        { $$ = $1 + " / NULLIF(" + $3 + ", 0)"
        ;}
    | e '^' e
        {$$ = "POWER( " + $1 + ", " + $3 + ")"; }
    | '-' e %prec UMINUS
        {$$ = "-" + $2;}
    | '(' e ')'
        {$$ = "("+$2+")";}
    | NUMBER
        {$$ = yytext;}
    | VARIABLE
        {$$ = yytext; }
    | FUNC0
        {$$ = $1 + "()";}
    | 'FUNC2' e ',' e ')'
        {
            $$ = $1 + $2 + ", " + $4 + ")";
        }
    | 'FUNC1' e ')'
        {$$ = $1 + $2 + ")";}
    | 'FACTORIAL' e ')'
        {$$ = 'FACTORIAL((' + $2 + ")::bigint)";}
    ;


