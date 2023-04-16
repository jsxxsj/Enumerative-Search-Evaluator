//please use -JSX- to search modified codes
// the evaluator for searching
// currently we use the same evaluator for searching and evaluating

const { is_boolean, head, pair, error, tail } = require('sicp');

/* *************
 * import
 * *************/
Object.entries(require('sicp'))
     .forEach(([name, exported]) => global[name] = exported);

/* *************
 * parse to JSON
 * *************/
const list_to_array = xs =>
    is_null(xs)
    ? []
    : [head(xs)].concat(list_to_array(tail(xs)))

// simplify parameter format
const parameters = xs =>
    map(x => head(tail(x)),
        xs)

// turn tagged list syntax from parse into JSON object
// -JSX- modifiy ast_to_json to let it suitable for this scenario
const ast_to_json = t => {
    switch (head(t)) {
        case "literal":
            return { tag: "lit", val: head(tail(t)) }
        case "name":
            return { tag: "nam", sym: head(tail(t)) }
        case "application":
            return {
                tag: "app",
                fun: ast_to_json(head(tail(t))),
                args: list_to_array(map(ast_to_json, head(tail(tail(t)))))
                      .reverse()  // microcode for app expects arg
                                  // expressions in reverse order
            }
        case "logical_composition":
            return {
                // tag: "log",
                // sym: head(tail(t)),
                tag: "log"+ head(tail(t)),
                frst: ast_to_json(head(tail(tail(t)))),
                scnd: ast_to_json(head(tail(tail(tail(t)))))
            }
        case "binary_operator_combination":
            return {
                // tag: "binop",
                // sym: head(tail(t)),
                tag: "binop"+head(tail(t)),
                frst: ast_to_json(head(tail(tail(t)))),
                scnd: ast_to_json(head(tail(tail(tail(t)))))
            }
        case "object_access": {
                if (is_pair(tail(tail(t))) &&
                    head(head(tail(tail(t)))) === "property" &&
                    head(tail(head(tail(tail(t))))) === "length") {
                        return {
                            tag: "arr_len",
                            expr: ast_to_json(head(tail(t)))
                        }
                } else {
                    return {
                        tag: "arr_acc",
                        arr: ast_to_json(head(tail(t))),
                        ind: ast_to_json(head(tail(tail(t))))
                    }
                }
            }
        case "object_access":
            return {
                tag: "arr_acc",
                arr: ast_to_json(head(tail(t))),
                ind: ast_to_json(head(tail(tail(t)))),
            }
        case "object_assignment":
            return {
                tag: "arr_assmt",
                arr: ast_to_json(head(tail(head(tail(t))))),
                ind: ast_to_json(head(tail(tail(head(tail(t)))))),
                expr: ast_to_json(head(tail(tail(t))))
            }
        case "array_expression":
            return {
                tag: "arr_lit",
                elems: list_to_array(map(ast_to_json, head(tail(t))))
                       .reverse()  // microcode for arr_lit expects
                                   // expressions in reverse order                
            }
        case "unary_operator_combination":
            return {
                // tag: "unop",
                // sym: head(tail(t)),
                tag: "unop"+head(tail(t)),
                frst: ast_to_json(head(tail(tail(t))))
            }
        case "lambda_expression":
            return {
                tag: "lam",
                prms: list_to_array(parameters(head(tail(t)))),
                body: ast_to_json(head(tail(tail(t))))
            }
        case "sequence":
            return {
                tag: "seq",
                stmts: list_to_array(map(ast_to_json, head(tail(t))))
            }
        case "block":
            return {
                tag: "blk",
                body: ast_to_json(head(tail(t)))
            }
        case "variable_declaration":
            return {
                tag: "let",
                sym: head(tail(head(tail(t)))),
                expr: ast_to_json(head(tail(tail(t))))
            }
        case "constant_declaration":
            return {
                tag: "const",
                sym: head(tail(head(tail(t)))),
                expr: ast_to_json(head(tail(tail(t))))
            }
        case "assignment":
            return {
                tag: "assmt",
                sym: head(tail(head(tail(t)))),
                expr: ast_to_json(head(tail(tail(t))))
            }
        case "conditional_statement":
            return {
                tag: "cond_stmt",
                pred: ast_to_json(head(tail(t))),
                cons: ast_to_json(head(tail(tail(t)))),
                alt: ast_to_json(head(tail(tail(tail(t)))))
            }
        case "while_loop":
            return {
                tag: "while",
                pred: ast_to_json(head(tail(t))),
                body: ast_to_json(head(tail(tail(t))))
            }
        case "break_statement":
            return { tag: "break" }
        case "continue_statement":
            return { tag: "cont" }
        case "conditional_expression":
            return {
                tag: "cond_expr",
                pred: ast_to_json(head(tail(t))),
                cons: ast_to_json(head(tail(tail(t)))),
                alt: ast_to_json(head(tail(tail(tail(t)))))
            }
        case "function_declaration":
            return {
                tag: "fun",
                sym: head(tail(head(tail(t)))),
                prms: list_to_array(parameters(head(tail(tail(t))))),
                body: ast_to_json(head(tail(tail(tail(t)))))
            }
        case "return_statement":
            return {
                tag: "ret",
                expr: ast_to_json(head(tail(t)))
            }
        case "try_statement":
            return {
                tag: "try",
                body: ast_to_json(head(tail(t))),
                sym: head(tail(head(tail(tail(t))))),
                catch: ast_to_json(head(tail(tail(tail(t)))))
            }       
        case "throw_statement":
            return {
                tag: "throw",
                expr: ast_to_json(head(tail(t)))
            }               
        default:
            error(t, "unknown syntax:")
    }
}


// parse, turn into json (using ast_to_json), 
// and wrap in a block
const parse_to_json = program_text =>
    ({tag: "blk",
      body: ast_to_json(parse(program_text))});

/* *************************
 * values of the interpreter
 * *************************/
// for numbers, strings, booleans, undefined, null
// we use the value directly

// closures aka function values
const is_closure = x =>
    x !== null && 
    typeof x === "object" &&
    x.tag === 'closure'

const is_builtin = x =>
    x !== null &&
    typeof x === "object" && 
    x.tag == 'builtin'

// catching closure and builtins to get short displays
const value_to_string = x => 
     is_closure(x)
     ? '<closure>'
     : is_builtin(x)
     ? '<builtin: ' + x.sym + '>'
     : stringify(x)

/* **********************
 * operators and builtins
 * **********************/

const binop_microcode = {
    '+': (x, y)   => (is_number(x) && is_number(y)) ||
                     (is_string(x) && is_string(y))
                     ? x + y 
                     : error([x,y], "+ expects two numbers" + 
                                    " or two strings, got:"),
    // todo: add error handling to JS for the following, too
    '*':   (x, y) => x * y,
    '-':   (x, y) => x - y,
    '/':   (x, y) => x / y,
    '%':   (x, y) => x % y,
    '<':   (x, y) => x < y,
    '<=':  (x, y) => x <= y,
    '>=':  (x, y) => x >= y,
    '>':   (x, y) => x > y,
    '===': (x, y) => x === y,
    '!==': (x, y) => x !== y
}

// v2 is popped before v1
const apply_binop = (op, v2, v1) => binop_microcode[op](v1, v2)

const unop_microcode = {
    '-unary': x => - x,
    '!'     : x => is_boolean(x) 
                   ? ! x 
                   : error(x, '! expects boolean, found:')
}

const apply_unop = (op, v) => unop_microcode[op](v)

const builtin_mapping = {
    display       : display,
    get_time      : get_time,
    stringify     : stringify,
    error         : error,
    prompt        : prompt,
    is_number     : is_number,
    is_string     : is_string,
    is_function   : x => typeof x === 'object' &&
                         (x.tag == 'builtin' ||
                          x.tag == 'closure'),
    is_boolean    : is_boolean,
    is_undefined  : is_undefined,
    parse_int     : parse_int,
    char_at       : char_at,
    arity         : x => typeof x === 'object' 
                         ? x.arity
                         : error(x, 'arity expects function, received:'),
    math_abs      : math_abs,
    math_acos     : math_acos,
    math_acosh    : math_acosh,
    math_asin     : math_asin,
    math_asinh    : math_asinh,
    math_atan     : math_atan,
    math_atanh    : math_atanh,
    math_atan2    : math_atan2,
    math_ceil     : math_ceil,
    math_cbrt     : math_cbrt,
    math_expm1    : math_expm1,
    math_clz32    : math_clz32,
    math_cos      : math_cos,
    math_cosh     : math_cosh,
    math_exp      : math_exp,
    math_floor    : math_floor,
    math_fround   : math_fround,
    math_hypot    : math_hypot,
    math_imul     : math_imul,
    math_log      : math_log,
    math_log1p    : math_log1p,
    math_log2     : math_log2,
    math_log10    : math_log10,
    math_max      : math_max,
    math_min      : math_min,
    math_pow      : math_pow,
    math_random   : math_random,
    math_round    : math_round,
    math_sign     : math_sign,
    math_sin      : math_sin,
    math_sinh     : math_sinh,
    math_sqrt     : math_sqrt,
    math_tanh     : math_tanh,
    math_trunc    : math_trunc,
    pair          : pair,
    is_pair       : is_pair,
    head          : head,
    tail          : tail,
    is_null       : is_null,
    set_head      : set_head,
    set_tail      : set_tail,
    array_length  : array_length,
    is_array      : is_array,
    list          : list,
    is_list       : is_list,
    display_list  : display_list,
    // from list libarary
    equal         : equal,
    length        : length,
    list_to_string: list_to_string,
    reverse       : reverse,
    append        : append,
    member        : member,
    remove        : remove,
    remove_all    : remove_all,
    enum_list     : enum_list,
    list_ref      : list_ref,
    // misc
    draw_data     : draw_data,
    parse         : parse,
    tokenize      : tokenize,
    apply_in_underlying_javascript: apply_in_underlying_javascript
}

const apply_builtin = (builtin_symbol, args) =>
    builtin_mapping[builtin_symbol](...args)

/* ************
 * environments
 * ************/

// Frames are objects that map symbols (strings) to values.

const global_frame = {}
// fill global frame with built-in objects
for (const key in builtin_mapping) 
    global_frame[key] = { tag:   'builtin', 
                          sym:   key, 
                          arity: arity(builtin_mapping[key])
                        }
// fill global frame with built-in constants
global_frame.undefined    = undefined
global_frame.math_E       = math_E
global_frame.math_LN10    = math_LN10
global_frame.math_LN2     = math_LN2
global_frame.math_LOG10E  = math_LOG10E
global_frame.math_LOG2E   = math_LOG2E
global_frame.math_PI      = math_PI
global_frame.math_SQRT1_2 = math_SQRT1_2
global_frame.math_SQRT2   = math_SQRT2

// An environment is null or a pair whose head is a frame 
// and whose tail is an environment.
const empty_environment = null
const global_environment = pair(global_frame, empty_environment)

const lookup = (x, e) => {
    if (is_null(e)) 
        error(x, 'unbound name:')
    if (head(e).hasOwnProperty(x)) {
        const v = head(e)[x]
        if (is_unassigned(v))
            error(cmd.sym, 'unassigned name:')
        return v
    }
    return lookup(x, tail(e))
}

const assign = (x, v, e) => {
    if (is_null(e))
        error(x, 'unbound name:')
    if (head(e).hasOwnProperty(x)) {
        head(e)[x] = v
    } else {
        assign(x, v, tail(e))
    }
}

const extend = (xs, vs, e) => {
    if (vs.length > xs.length) error('too many arguments')
    if (vs.length < xs.length) error('too few arguments')
    const new_frame = {}
    for (let i = 0; i < xs.length; i++) 
        new_frame[xs[i]] = vs[i]
    return pair(new_frame, e)
}
/* -JSX-
// the new frame model:
// instead of searching for unassigned when entering a blk
// we only create a new empty frame 
// when encounter a 'let', we add a new variable to the top frame
// the assmt acts as usual
// the function frame should still use 'extend()'
*/
const new_env_frame = (e) =>{
    return pair({},e)
}

const new_var = (x,v,e) =>{
    head(e)[x] = v;
    return(e);
}

// At the start of executing a block, local 
// variables refer to unassigned values.
const unassigned = { tag: 'unassigned' }

const is_unassigned = v => {
    return v !== null && 
    typeof v === "object" && 
    v.hasOwnProperty('tag') &&
    v.tag === 'unassigned'
} 

/* ******************
 * handling sequences
 * ******************/

// Every sequence pushes a single value on stash.
// Empty sequences push undefined.
// Commands from non-empty sequences are separated 
// by pop_i instructions so that only the result
// result of the last statement remains on stash.
const handle_sequence = seq => {
    if (seq.length === 0) 
        return [{tag: "lit", undefined}]
    let result = []
    let first = true
    for (let cmd of seq) {
        first ? first = false
              : result.push({tag: 'pop_i'})
        result.push(cmd)
    }
    return result.reverse()
}
/* ***************
 * handling blocks
 * ***************/

// scanning out the declarations from (possibly nested)
// sequences of statements, ignoring blocks
const scan = comp => 
    comp.tag === 'seq'
    ? comp.stmts.reduce((acc, x) => acc.concat(scan(x)),
                        [])
    : ['let', 'const', 'fun'].includes(comp.tag)
    ? [comp.sym]
    : []

/* **********************
 * using arrays as stacks
 * **********************/

// add values destructively to the end of 
// given array; return the array
const push = (array, ...items) => {
    array.splice(array.length, 0, ...items)
    return array 
}

// return the last element of given array
// without changing the array
const peek = array =>
    array.slice(-1)[0]
    
/* **************************
 * interpreter configurations
 * **************************/

// An interpreter configuration has three parts:
// A: agenda: stack of commands
// S: stash: stack of values
// E: environment: list of frames

// agenda A

// The agenda A is a stack of commands that still need
// to be executed by the interpreter. The agenda follows 
// stack discipline: pop, push, peek at end of the array.

// Commands are nodes of syntax tree or instructions.

// Instructions are objects whose tag value ends in '_i'.

// Execution initializes A as a singleton array
// containing the given program.

let A = []

// stash S 
/*  To adapt the function call, we modify S a little:
    We let S to have frames
    every time we encounter a fuction call, we create a new empty frame
    thus the closure will alway on the bottom of the new S frame
    and every time we return from a fuction, we pop the top of the new frame
        then push it back to the old ones
 */
let RTS = [];
let S = []

const new_S_frame = _ => {
    push(RTS,{tag:"stash_frame",stash:S});
    S = [];
    //console.log("\nnew s frame created")
    //console.log(S_chain)
}

const exit_S_frame = _ => {
    //console.log("\ntrying to exit s frame")
    //console.log(S_chain)
    const ret = S.pop();
    const frame = RTS.pop();
    if(frame.tag !== "stash_frame")error("not a stash frame");
    S = frame.stash;
    push(S,ret);
}

// environment E

// See *environments* above. Execution initializes 
// environment E as the global environment.

let E

/* *********************
 * interpreter microcode
 * *********************/

// The interpreter dispaches for each command tag to the 
// microcode that belong to the tag.

// microcode.cmd_tag is the microcode for the command,
// a function that takes a command as argument and 
// changes the configuration according to the meaning of
// the command. The return value is not used.
        
const microcode = {
//
// expressions
//
lit:
    cmd =>
    push(S, cmd.val),
nam:
    cmd => 
    push(S, lookup(cmd.sym, E)),
unop:
    cmd =>
    push(A, {tag: 'unop_i', sym: cmd.sym}, cmd.frst),
binop:
    cmd =>
    push(A, {tag: 'binop_i', sym: cmd.sym}, cmd.scnd, cmd.frst),
log:
    cmd => 
    push(A, cmd.sym == '&&' 
            ? {tag: 'cond_expr', 
               pred: cmd.frst, 
               cons: {tag: 'lit', val: true},
               alt: cmd.scnd}
            : {tag: 'cond_expr',  
               pred: cmd.frst,
               cons: cmd.scnd, 
               alt: {tag: 'lit', val: false}}),
// cond_expr: 
//     cmd => 
//     push(A, {tag: 'branch_i', cons: cmd.cons, alt: cmd.alt}, cmd.pred),
// app: 
//     cmd =>
//     push(A, {tag:'EXIT_S'},
//             // {tag: 'app_i', arity: cmd.args.length},
//             {tag:'CALL'}, 
//             ...cmd.args, // already in reverse order, see ast_to_json
//             cmd.fun,
//             {tag:'ENTER_S'}
//             ),
assmt: 
    cmd =>
    push(A, {tag: 'assmt_i', sym: cmd.sym}, cmd.expr),
lam:
    cmd =>
    push(S, {tag: 'closure', prms: cmd.prms, body: cmd.body, env: E}),
arr_acc: 
    cmd =>
    push(A, {tag: 'arr_acc_i'}, cmd.ind, cmd.arr),
arr_assmt: 
    cmd => 
    push(A, {'tag': 'arr_assmt_i'}, cmd.expr, cmd.ind, cmd.arr),

//
// statements
//
seq: 
    cmd => push(A, ...handle_sequence(cmd.stmts)),
cond_stmt:
    cmd =>
    push(A, {tag: 'branch_i', cons: cmd.cons, alt: cmd.alt},
            cmd.pred),
blk:
    cmd => {
        const locals = scan(cmd.body)
        const unassigneds = locals.map(_ => unassigned)
        if (! (A.length === 0))
            push(A, {tag: 'env_i', env: E})
        push(A, cmd.body)
        E = extend(locals, unassigneds, E)
    },
let: 
    cmd => 
    push(A, {tag: 'lit', val: undefined}, 
            {tag: 'pop_i'},
            {tag: 'assmt', sym: cmd.sym, expr: cmd.expr}),
const:
    cmd =>
    push(A, {tag: "lit", val: undefined},
            {tag: 'pop_i'},
            {tag: 'assmt', sym: cmd.sym, expr: cmd.expr}),
ret:
    cmd =>
    push(A, {tag: 'reset_i'}, cmd.expr),
fun:
    cmd =>
    push(A, {tag:  'const',
             sym:  cmd.sym,
             expr: {tag: 'lam', prms: cmd.prms, body: cmd.body}}),
while:
    cmd =>
    push(A, {tag: 'lit', val: undefined},
            {tag: 'while_i', pred: cmd.pred, body: cmd.body},
            cmd.pred),
//
// instructions
//
reset_i:
    cmd =>
    A.pop().tag === 'mark_i'    // mark found?  
    ? null                    // stop loop
    : push(A, cmd),           // continue loop by pushing same
                              // reset_i instruction back on agenda
assmt_i:  
    // peek top of stash without popping:
    // the value remains on the stash
    // as the value of the assignment
    cmd =>
    assign(cmd.sym, peek(S), E),
unop_i:
    cmd => 
    push(S, apply_unop(cmd.sym, S.pop())),
binop_i: 
    cmd =>
    push(S, apply_binop(cmd.sym, S.pop(), S.pop())),
pop_i: 
    _ =>
    S.pop(),
// app_i: 
//     cmd => {
//         const arity = cmd.arity
//         let args = []
//         for (let i = arity - 1; i >= 0; i--)
//             args[i] = S.pop()
//         const sf = S.pop()
//         if (sf.tag === 'builtin')
//             return push(S, apply_builtin(sf.sym, args))
//         /*-JSX- for convience of debugging, we ban the tail recursion
//          */
//         // remaining case: sf.tag === 'closure'
//         // if (A.length === 0 || peek(A).tag === 'env_i') {   
//         //     // current E not needed:
//         //     // just push mark, and not env_i
//         //     push(A, {tag: 'mark_i'})
//         // } else if (peek(A).tag === 'reset_i') {            
//         //     // tail call: 
//         //     // The callee's ret_i will push another reset_i
//         //     // which will go to the correct mark.
//         //     A.pop()
//         //     // The current E is not needed, because
//         //     // the following reset_i is the last body 
//         //     // instruction to be executed.
//         // } else {
//         //     // general case:
//         //     // push current environment
//         //     push(A, {tag: 'env_i', env: E}, {tag: 'mark_i'}) 
//         // }
//         push(A, {tag: 'env_i', env: E}, {tag: 'mark_i'}) 
//         push(A, sf.body)
//         E = extend(sf.prms, args, sf.env)
//     },
app_i:
    cmd =>{
        console.log("entering app_i!");
        console.log(S);
        /*in the new stash model we keep pop until the final one,
         *which is the closure of this fuction/lambda
         */
        const arity = S.length - 1;
        let args = []
        for (let i = arity - 1; i >= 0; i--)
            args[i] = S.pop()
        const sf = S.pop()
        if (sf.tag === 'builtin')
            return push(S, apply_builtin(sf.sym, args))
        push(A, {tag: 'env_i', env: E}, {tag: 'mark_i'}) 
        push(A, sf.body)
        E = extend(sf.prms, args, sf.env)
    },
branch_i: 
    cmd => 
    push(A, S.pop() ? cmd.cons : cmd.alt),
while_i:
    cmd => 
    S.pop() 
    ? push(A, cmd,             // push while_i itself back on agenda
              cmd.pred,
              {tag: 'pop_i'},  // pop body value
              cmd.body)        
    : null,
env_i: 
    cmd => 
    E = cmd.env,
arr_acc_i:
    cmd => {
        const ind = S.pop()
        const arr = S.pop()
        push(S, arr[ind])
    },       
arr_assmt_i:
    cmd => {
        const val = S.pop()
        const ind = S.pop()
        const arr = S.pop()
        arr[ind] = val
        push(S, val)
    },

//*-JSX-*#####################################################################
// self-defined parts
//*
"binop+":
    cmd =>push(A, {tag: 'binop_i', sym: '+'}, cmd.scnd, cmd.frst),
"binop-":
    cmd =>push(A, {tag: 'binop_i', sym: '-'}, cmd.scnd, cmd.frst),
"binop*":
    cmd =>push(A, {tag: 'binop_i', sym: '*'}, cmd.scnd, cmd.frst),
"binop/":
    cmd =>push(A, {tag: 'binop_i', sym: '/'}, cmd.scnd, cmd.frst),
// instructions
//*
//special instrs
EVAL:
//though CE is in fact an experssion, we process it as it's a Instrction
//usually a CE will push something into the A or the S
    cmd =>{
        if(cmd.comp.tag !== "CE"){
            // error("trying to evaluate a non-CE expr using EVAL");
            push(A,cmd.comp);
            return;
        }
        //console.log("\n hit a CE\n");
        if(cmd.comp.A !== undefined){
            //console.log("\n push a:",);
            Array.isArray(cmd.comp.A)
            ?push(A,...cmd.comp.A)//if the parameter is a [], then split it
            :push(A,cmd.comp.A)
        }
        if(cmd.comp.S !== undefined){
            console.log("\n push s\n");
            push(S,cmd.comp.S);
        }},
CE:
    cmd=>{
        if(cmd.A !== undefined){
            //console.log("\n push a:",);
            push(A,cmd.A);
        }
        if(cmd.S !== undefined){
            //console.log("\n push s\n");
            push(S,cmd.S);}
    },
EMPTY:
    cmd =>{},
PUSHS:
    cmd =>{push(S,cmd.val)},
PUSHA:
    cmd =>{Array.isArray(cmd.val)
            ?push(A,...cmd.val)
            :push(A,cmd.val)
        },
POPS:
    cmd =>{
        //if(S.length == 0){error("trying to pop an empty S!")};
        S.pop();},
POPA:
    cmd =>{
        //if(A.length == 0){error("trying to pop an empty A!")};
        A.pop();},
//calculator languages
ADD:
    cmd =>{push(S,apply_binop('+',S.pop(),S.pop()))},
SUB:
    cmd =>{push(S,apply_binop('-',S.pop(),S.pop()))},
TIMES:
    cmd =>{push(S,apply_binop('*',S.pop(),S.pop()))},
DIVISION:
    cmd =>{push(S,apply_binop('/',S.pop(),S.pop()))},
GT:
    cmd =>{push(S,apply_binop('>',S.pop(),S.pop()))},
LT:
    cmd =>{push(S,apply_binop('<',S.pop(),S.pop()))},
EQUAL:
    cmd =>{push(S,apply_binop('===',S.pop(),S.pop()))},
//branch and loop
ROF://replace on false
    cmd =>{
        //console.log("entering ROF")
        const pred = S.pop();
        if(!is_boolean(pred))error("ROF:non-boolean value in prediction");
        if(pred){// if the value is true
            return;//do nothing
        }
        else{
            A.pop();
            A.push(cmd.comp);//else replace the top of A with component
        }
    },

//envs
LET://add a new pair to the env: sym: cmd.sym, val: S.pop
    //we use null for the interval 
    cmd =>{
        const v = S.pop();
        const x = cmd.sym;
        E = new_var(x,v,E);
        push(S,null);
    },
ENTER_E:
    cmd =>{
        if(!A.length === 0)
            push(A,{tag:'env_i',env:E});
        push(A,cmd.comp);
        E = new_env_frame(E);
    },
ASSIGN:  
    //we don't consider about any of the efficiency
    //every time we need assign something, we just use a new frame
    cmd =>{
        const x= cmd.sym;
        const v = peek(S);
        assign(x,v,E)
    },
LD:
    cmd =>push(S, lookup(cmd.sym, E)),


ENTER_S:
    cmd =>new_S_frame(),

EXIT_S:
    cmd =>exit_S_frame(),
LDF:
    cmd =>{
        if(cmd.obj.tag !== "lam"){error("only lam are allowed in LDF\n");}
        push(S,{tag:'closure', prms: cmd.obj.prms, body: cmd.obj.body, env: E});
    },
CALL:
    //we do not use arity or attributes
    //if we take a CALL for mistake, just report an error
    cmd => {
        // console.log("entering app_i!");
        // console.log(S);
        /*in the new stash model we keep pop until the final one,
        *which is the closure of this fuction/lambda
        */
        const arity = S.length - 1;
        let args = []
        for (let i = arity - 1; i >= 0; i--)
            args[i] = S.pop()
        const sf = S.pop()
        if (sf.tag === 'builtin')
            return push(S, apply_builtin(sf.sym, args))
        push(A, {tag: 'env_i', env: E}, {tag: 'mark_i'}) 
        push(A, sf.body)
        E = extend(sf.prms, args, sf.env)
        },
}


/* ****************
 * interpreter loop
 * ****************/

const step_limit = 1000000

//modified to suit for receive outside A,S&E
const execute = () => {
    // A = [parse_to_json(program)]
    // S = []
    // E = global_environment
    let i = 0
    while (i < step_limit) {
        if (A.length === 0) break
        const cmd = A.pop()
        if (microcode.hasOwnProperty(cmd.tag)) {
            microcode[cmd.tag](cmd)
            // // debug(cmd)
            // console.log("###############")
            // console.log(A);
            // console.log(S);
            // console.log(E);
        } else {
            error("", "unknown command: " + 
                      command_to_string(cmd))
        }
        i++
    }
    if (i === step_limit) {
        error("step limit " + stringify(step_limit) + " exceeded")
    }
    // if (S.length > 1 || S.length < 1) {
    //     error(S, 'internal error: stash must be singleton but is: ')
    // }
    //return display(S[0])
}

/* *********
 * debugging
 * *********/

// used for display of environments
const all_except_last = xs =>
    is_null(tail(xs))
    ? null 
    : pair(head(xs), all_except_last(tail(xs)))

const command_to_string = cmd =>
    (cmd.tag === 'env_i')
    ? '{ tag: "env_i", env: ...}'
    : JSON.stringify(cmd)

const debug = (cmd) => {
    display(cmd.tag, "executed command:")
    display("", "A:")
    for (let cmd of A) 
       display('', command_to_string(cmd))
    display("", "S:")
    for (let val of S)
       display('', value_to_string(val))
    display("", "E:")
    for_each(frame => {
                for (const key in frame) {
                    display("", key + ": " + value_to_string(frame[key]))
                }
                display("",'               ')
             },
             all_except_last(E))
    console.log("#########################\n");
}

/* *******
 * -JSX-:for sequence searching
 * *******/

const run_seq = (o_A,o_S,o_E) =>{
    A = structuredClone(o_A);
    S = structuredClone(o_S);
    E = structuredClone(o_E);
    execute();
    output = {S:S,A:A,E:E}
    return output;
}

const extend_one = (x,v,e) =>{
    const local = [x]
    const val = [v]
    return extend(local,val,e)
}

const json_parse = program_text => ast_to_json(parse(program_text));
/*-JSX-
 the env for microcode embedding
 */
//this env save the necessary info for build a microcode lambda expr
let micro_env = {};
const new_micro_rule = rule_obj =>{
    micro_env[rule_obj.tag] = rule_obj.nodes
}
const apply_micro_rule = cmd =>{
    // console.log("applying rule [",cmd.tag,"]!")
    const tag = cmd.tag;
    const rules = structuredClone( micro_env[tag]);

    let comps = [];
    rules.forEach(rule => {
        // console.log("entering cmd:", rule[1].tag);
        if(rule.length === 2){//Instrs with no args
            // console.log("cmd has no args");
            push(comps , structuredClone(rule[1]));
        }
        else if(rule.length === 3){//Instrs with args
            // console.log("cmd has args");
            let keys = Object.keys(rule[1]);
            let arg_key = null;
            //get the location of "__search__"
            keys.forEach(key => {
                if(rule[1][key] === "__search__")
                    {arg_key = key}
            })
            // console.log("the arg comp is: ",arg_key);
            //modify the rule
            // the components of "__search__" location
            // should be the corresponding ones in the cmd
            let comp = structuredClone(rule[1])
            comp[arg_key] = cmd[rule[2].id]
            push(comps , comp)
        }
    })
    // console.log("the Instr seq")
    // console.log(comps);
    //finally push comp to the Agenda
    push(A,...(comps.reverse()));
}
const embed_micro_rule = tag =>{
    microcode[tag] = apply_micro_rule;
    console.log("rule [",tag,"] successfully embedded");
}




/* *******
 * -JSX-:export part
 * *******/
exports.global_environment = global_environment;
exports.parse_to_json = parse_to_json;
exports.run_seq = run_seq;
exports.extend_one = extend_one;
exports.json_parse = json_parse;

exports.vm_S = S;
exports.vm_A = A;
exports.vm_E = E;

exports.micro_env = micro_env;
exports.new_micro_rule = new_micro_rule;
exports.apply_micro_rule = apply_micro_rule;
exports.embed_micro_rule = embed_micro_rule;



/*
 * test codes
 */
// console.log(json_parse("{{{let x = y;}}}"))
// console.log(json_parse(" x = 8;"))
// console.log(json_parse("true?a:b;"))
// console.log(json_parse("((a,b) => a + 2)(3 + 5,7 * 7);"))
// console.log(json_parse("s;"))
// console.log(json_parse("a=>a+3;"))
// console.log(run_seq([json_parse("3+9;")],[],[]))
// console.log(microcode.hasOwnProperty("binop+"));
// console.log(run_seq([json_parse("((x,y,z) => z(y) + x)(2, 8,a => a + 4);")],[9,8,7,6],[]))
