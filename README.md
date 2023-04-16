# Enumerative-Search-Evaluator
A repo of CS4215 term project
This readme file contains a more specified description for the setups and testcases.

## Introduction
In this project we explore the possibility of translating abstract semantic rules automatically between two widely used ends: the microcode inside an evaluator and the programs. In particular, we extract the patterns of some semantic rules from a given bunch of example programs/ testcases, and embed them into the microcode part of a Explicit Control Evaluator(ECE). The whole project is based on the programs given in the homework of module CS4215, and some demonstrations may base on the context of M3 in this module. 

![pic1](https://github.com/jsxxsj/Enumerative-Search-Evaluator/blob/main/pics/pic1_structure.png)

The figure above shows the overall scope of this project. What we're given is an incomplete ECE with only the instruction part, complete knowledge of the instruction set and some testcases with special limitations. The output of the searcher is the abstract semantic rules extracted from the testcases in the form of lambda expressions. After search, we embed the semantic rule into the given ECE as a property of its microcodes objects, so that the ECE can handle the execution of newly embedded rules.

## architecture description
The file tree of this project is as below
```
-testcases
-results
-utils  |-
		|-P_case_builder.cjs
		|-P_enum_search.cjs
		|-P_eval_build.cjs
		|-P_eval.cjs
-P_search.cjs
-P_demo_1_print_sequence.cjs
-P_demo_2_enum_search.cjs
-P_demo_3_rule_embed.cjs
```
- `P_enum_search.cjs` provides the class for searching of one and multiple instructions; `P_eval.cjs` and
- `P_eval_build.cjs` are the modified evaluator for correctness checking and rule embedding, respectively.  
- `P_case_builder.cjs` provides methods for making testcases a bit more convenient that manually setup a complex JSON.
- `P_search.cjs` is the highest structure of this project, which uses the utils to perform the enumerative stepping of instruction sequences, the correctness checking, and the embedding.
- The `P_demo` series are the sample programs/demos shows how the programs working and how can the codes be used.

## Setup
This project is built up on a windows pc using NodeJS, the windows version is Windows 10 22H2, the Node version is Node.js v18.13.0.

After installing NodeJS to the computer, we need to setup the NodeJS environment and install the SICP library.

1. clone the project and open the main folder
2. enter command 
```
$yarn init
```
some new files should be created.
3. enter the newly created `package.json` and add a new property
```JSON
{
  ...
  "type": "module"
}  
```
The the project should work.

## feature presentation
The 3 demos give a presentation of how this project work. For convenience all demos are built on a copy of `P_search.cjs`. After setup, simply run them and the output should be shown on the terminal.

#### 1. enumerate all possibilities
To simply list out all possibilities of one instruction sequence,first we need to instantiate an `Enum.Forest()` and a `Case_manager()` class to perform the search structure and provides context(Eval, Value, etc.) management, respectively.
``` JavaScript
let man = new Case_manager(
    "./testcases/binop+.json"
)
let len =2
let a = new Enum.Forest(len,Instr);
```
Then we use a loop controlled by the `one_step()`method of `Enum_forest` to go through all possibilities. Remember to use the `parse()`method to transfer the search structure to JSON before output.
```JavaScript
while(!a.one_step()){        console.log("###############################################")
        const ia = a.parse()
        for(i = 0; i< len; i++)
            console.log(ia[i]);
        // console.log(Enum.run(i_S,i_A,i_E));
    }
```

The expected output:
 ==pic2==
#### 2.perform search operation
To check the correctness and perform enumerative search, we need to use the `test()` method provided by `Case_manager`, which will send the instruction sequence into the evaluator and check if the outcome matches the testcase.

```JavaScript
while(!a.one_step()){
        if(man.test(a)){
		        //print sequence
                const ia = a.parse()
                for(i = 0; i< 3; i++)
                        console.log(ia[i]);
                //print result
                console.log(Enum.run(i_S,i_A,i_E));

            }
    }
```
Expected output:
==pic3==

#### 3.embed rules
First we need to get a rule in JSON format before embedding: 1. we can get using a succeed search structure and call the `build_rule()` function.
```JavaScript
if(man.test(a)){//once succeed
                console.log("one rule found");
				//build the rule
                const rule = build_rule(man,a);
				//store the rule
                fs.writeFile('./demo5_binopGT.json', JSON.stringify(rule), (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log("result saved");
                });
				//end search
                break;            
            }
```
Or 2. load one saved JSON file.
```JavaScript
const rule_app = require("./rule4.json");
```

To embed the rule, we use methods provided by the modified evaluators. First, we use `new_micro_rule()` to import the rule JSON object into a result environment, a JSON to store the information
```JavaScript
Eval_build.new_micro_rule(rule_app);
```
Then we use `embed_micro_rule()` to modify the `microcodes` object of this evaluator, so that it can handle corresponding rules using the result environment.

The expected output:
==pic4==
