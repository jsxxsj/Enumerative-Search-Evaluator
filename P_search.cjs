/* this isthe highest level control of the whole project:
 * - load the pre-set test cases of one rule
 * - set up the enum_search structure for a certain rule
 * - execute the search process:
 *      - get a sequence from the search structure
 *      - pre-check the sequence
 *      - send the structure to evaluator to test
 *      - change test cases
 * - process the results
 *      - save (and load) results
 *      - change json results(sequences) to lambda exprs
 *      - embed results back to evaluator
 */

/*import modules
 */
Object.entries(require('sicp'))
     .forEach(([name, exported]) => global[name] = exported);
let Enum = require("./utils/P_enum_search.cjs")
let Eval = require("./utils/P_eval.cjs")
let Eval_build = require("./utils/P_eval_build.cjs")
const fs = require('fs')

/* the assistant fuctions
 */
const push = (array, ...items) => {
    // fixed by Liew Zhao Wei, see Discussion 5
    for (let item of items) {
        array.push(item);
    }
    return array ;
}

const peek = (array, address) =>
   array.slice(-1 - address)[0];

/* The search structure:
 * We simplify the search tree to only 2 levels: the Instrs -- the Values and the CEs
 * for currently we do not find any cmd which leads to recursive structure
 */

//* the Values and Exprs are specified by different testcases
let Value = [];
let init_Value = [
    //{id:'lit',tag:'value',val:undefined},
    {id:'lit',tag:'value',val:null},
]
let Expr = [];
let init_Expr = [
    {id:'placeholder',tag:'CE'},
]

//* the Instructions are fixed for search
let Instr = [
    //special Instrs
        {tag:"EMPTY"},//nothing happens
        {tag:"EVAL",comp:'__search__',subset:Expr},//for common expressions
        //add an entrance to place the comps in Expr directly to the seq
    // direct operation(deprecated)
        // {tag:"PUSHS",val:"__search__",subset:Value},
        // {tag:"POPS"},
        {tag:"PUSHA",val:"__search__",subset:Value},
        {tag:"POPA"},// usually the sequence won't directly operate the A or S
        
    //calculator language
        {tag:"ADD"},
        {tag:"SUB"},
        {tag:"TIMES"},
        {tag:"DIVISION"},
        {tag:"GT"},
        {tag:"LT"},
        {tag:"EQUAL"},

    //branch and recursion
        {tag:"ROF",comp:'__search__',subset:Expr},//replace on false
    
    //env-related instrs
        {tag:"LET",sym:'__search__',subset:Value},//tag: let
        {tag:"ASSIGN",sym:'__search__',subset:Value},// tag: assmt
        {tag:"LD",sym:'__search__',subset:Value},//tag:nam 
        // {tag:"ENTER_E",comp:'__search__',subset:Expr},
        // {tag:"EXIT_E"},//enter and exit a E frame
    
    //function-related instrs
        {tag:"LDF",obj:'__search__',subset:Expr},//tag: lam
        {tag:"CALL"},// tag app
        {tag:"ENTER_S"},
        {tag:"EXIT_S"}//enter and exit a S frame
    ];

/*search strctures:
 *    - we compare the outpout of ece with the pre-set ones for correctness
 */
let i_S = [];
let i_A = [];
let i_E = [];
let o_S = [];
let o_A = [];
let o_E = [];
   
class Case_manager{
    constructor(path){//open the json file at the given path
        const case_json = require(path);
        this.tag = case_json.tag;
        this.forestlen = case_json.forest_num
        this.case = case_json.testcase;
        this.casenum = case_json.testcase_num;
        this.caseptr = 0;
        this.setup();
    }
    setup(){//build the env of one certain case
        i_S = [];
        //i_A = [];
        i_E = [];
        o_S = [];
        o_A = [];
        o_E = [];
        const one_case = this.case[this.caseptr]
        if(one_case.i_S !== undefined && one_case.i_S !== [])
            i_S = one_case.i_S;
        // if(one_case.i_A !== undefined)
        //     i_A = one_case.i_A;
        if(one_case.i_E !== undefined && one_case.i_E !== [])
            i_E = one_case.i_E;
        if(one_case.o_S !== undefined && one_case.o_S !== [])
            o_S = one_case.o_S;
        if(one_case.o_A !== undefined && one_case.o_A !== [])
            o_A = one_case.o_A;
        if(one_case.o_E !== undefined && one_case.o_A !== [])
            o_E = one_case.o_E;
        Value.length = 0;
        push(Value,...init_Value) ;   
        if(one_case.Value !== undefined){
            //clear the same obj
            push(Value,...one_case.Value)
        }
        Expr.length = 0;//clear the same obj
        push(Expr,...init_Expr)
        if(one_case.Expr !== undefined){
            push(Expr,...one_case.Expr)
            // console.log("\n################################")
            // console.log(Expr);
        }

    }
    test(forest){
        /*test all cases for one give sequence
         *the arg must be a Enum.forest
         */
        for(let i = 0; i<this.casenum;i++){
            this.caseptr = i;
            this.setup();
            i_A = forest.parse();
            // console.log("\ninput:",i_A);
            // console.log("\noutput:",Enum.run(i_S,i_A,i_E))
            // console.log("\nexpect:",{S:o_S,A:o_A,E:o_E})
            if(!Enum.compare(i_S,i_A,i_E,o_S,o_A,o_E)) 
                return false; //return as long as one negative
        }
        return true;
    }
}
const build_rule = (case_manager, forest) => {
    let rule_obj = forest.gen_result();
    rule_obj.instr_num = rule_obj.num;
    rule_obj.tag = case_manager.tag;
    return rule_obj;
}




