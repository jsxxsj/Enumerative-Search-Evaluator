Object.entries(require('sicp'))
     .forEach(([name, exported]) => global[name] = exported);

// const Enum = require('./P_enum_search.cjs')
const Eval = require('./P_eval.cjs')
const Eval_ori = require('./P_eval.cjs')
const fs = require('fs')
const push = (array, ...items) => {
     array.splice(array.length, 0, ...items)
     return array 
}
const run_ori = (i_S,i_A,i_E) => {
let err = false;
    try{
         o_State = Eval_ori.run_seq(i_A,i_S,i_E);   
    }catch(e){
         err = true;
         console.log(e);
         o_State = {S:i_S,A:Eval_ori.i_A,E:Eval_ori.i_E,ERR:err};
    }
    o_State.ERR = err;
    return o_State;
}

function build_one_case(program_obj){
/* take the inputs, gen outputs use original evaluater, 
 * then re_group the them to be in format of testcases
 * the program_obj should include an expression and its context using S & E
 * e.g. {
 *        program:"x + 2;"
 *        i_E:[{x : 2},[]]
 *        }
 */
     let result = {};
     const Eval_input = Eval_ori.json_parse(program_obj.program)
     //get the input context
     result.tag = Eval_input.tag;
     result.i_S = program_obj.i_S;
     const Eval_is = 
          (program_obj.i_S === undefined)
          ?[]:result.i_S;
     result.i_E = program_obj.i_E;
     const Eval_ie = 
          (program_obj.i_E === undefined)
          ?[]:result.i_E;
     //get the output context
     const Eval_output = run_ori(Eval_is,[Eval_input],Eval_ie)
     result.o_S = (Eval_output.S.length === 0)
          ?undefined:Eval_output.S;
     result.o_E = (Eval_output.E.length === 0)
          ?undefined:Eval_output.E;
     result.o_A = (Eval_output.A.length === 0)
          ?undefined:Eval_output.A;
     // result.ERR = Eval_output.ERR;
     //get the Expr and Value
     result.Expr = [];
     result.Value = [];
     const attributes = Object.keys(Eval_input);
     attributes.forEach((attr)=>{
          if(attr === 'tag')return;//we do not need the tag as a value
          if(Eval_input[attr].tag === undefined){//if not an expression
               push(result.Value,{
                    id:attr,
                    tag:"value",
                    val:Eval_input[attr]
               })
          } else {//is an expression
               let expr = Object.assign(Eval_input[attr]);
               expr.id = attr;
               push(result.Expr,expr)
          }
     })
     result.Expr.length === 0
          ?result.Expr = undefined
          :undefined;
     result.Value.length === 0
          ?result.Value = undefined
          :undefined;
     return(result)
}

function build_batch(filepath,forestNum,program_obj_batch){
     //process the datas
     let results = [];
     
     program_obj_batch.forEach(program_obj => {
          push(results,build_one_case(program_obj));
     })
     // add contexts
     let ret = {};
     ret.tag = results[0].tag;
     ret.comps = Object.keys( parse( program_obj_batch[0].program))
     ret.forest_num = forestNum;
     ret.testcase_num = results.length;
     results.forEach(result => {
          result.tag = undefined;
     })
     ret.testcase = results
     // store testcase
     const ret_data = JSON.stringify(ret)
     fs.writeFile(filepath, ret_data, (err) => {
          if (err) {
              throw err;
          }
          console.log("JSON data of rule [",ret.tag,"] is saved");
      });
     return ret;
}
// build_batch('./testcases/binop+.json',3,[
//      {program:"3+5;"},
//      {program:"2+0;"},
//      {program:"a+3;",i_E:[{a:1},[]]}
// ])

build_batch('./testcases/binopGT.json',3,[
     {program: "3 > 2;"},
     {program: "1 > 4;"}
])

// build_batch('./testcases/app.json',5,[
//      {program:"(x => x + 2)(3);",i_S:[2]},
//      {program:"((x,y) => x(y))(a => a +2, 8);",i_S:[3]},
// ])


// build_batch('./test.json',3,[
//      {program:"true?3:5;"},
//      {program:"x?4:6;",i_E:[{x:false},[]]}
// ])
// build_batch("./test2.json",5,
// [
//      {program:`(x => 8)(20);`},
//      {program:`(x => x)(7);`},
//      {program:`((x,y) => x(y))(x => 8, 20);`}
// ])