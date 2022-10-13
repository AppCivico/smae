
/* description: Parses and executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
[0-9]+("."[0-9]+)?\b  return 'NUMBER'
\$[A-Z]{1,5}?\b       return 'VARIABLE'
"*"                   return '*'
"/"                   return '/'
"-"                   return '-'
"+"                   return '+'
"^"                   return '^'
","                   return ','
"("                   return '('
")"                   return ')'
"PI"                  return 'FUNC0'
"ROUND("              return 'FUNC2'
"POWER("              return 'FUNC2'
"LOG("                return 'FUNC2'
(FACTORIAL|ABS|DIV|MOD|EXP|LN|FLOOR|CEIL)\(              return 'FUNC1'
<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

/* operator associations and precedence */

%left '+' '-'
%left '*' '/'
%left '^'
%left 'FUNC1'
%left 'FUNC2'
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
        {$$ = $1 + " / nullif(" + $3 + ", 0)";}
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
    ;

