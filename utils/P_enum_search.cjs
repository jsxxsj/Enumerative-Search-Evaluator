// *
// the core part of enumerative search
// 

/* 
// a node which constructs a tree, representing all possibilities of one instruction
// we don't build the whole tree, instead only build one path each time
// the nodes keep the information of all the possible children, 
//       and a pointer about what's the currently activated child
// we use DFS 
*/

/*imports
 */
let test_eval = require("./P_eval.cjs")
const fs = require("fs")

/* assistant functions
 */

const push = (array, ...items) => {
    // fixed by Liew Zhao Wei, see Discussion 5
    for (let item of items) {
        array.push(item);
    }
    return array ;
}

/* core search part
 */

class Enum_Node{
    depth_limit = 7;//using for control search space
    depth = 0; //we let the inherited class(i.e. the "tree" to control)
    constructor(parent,subset,data){
         this.data = data;// name like "Root", instr like "ADD" or value like 20
         this.parent = parent;//parent node
  
         this.subset = subset;// instead of a list of childs, we list all possible names of childs
         if(this.depth>=Enum_Node.depth_limit){this.subset = undefined}//depth handling
         
         this.childptr = 0;//current activated child
         this.create_child();
    }
    newchild(child_subset,child_data){//simply create a new child node
         delete(this.child)//clear old ones
         this.child = new Enum_Node(this,child_subset,child_data)
         this.child.depth_limit = this.depth_limit;
              this.child.depth = this.depth + 1;
    }
    create_child(){//create a child in subset, return true when created one  
         //check subset first
         if((this.subset === null) || (this.subset === undefined)){// do nothing when no subset
              return false; 
         }else if(this.subset[this.childptr] === undefined){
              //we check the child ptr when doing searching, 
              //   so typically there shouldn't be such situations
              console.error(this.data ,"is accessing non-existing child node");
         }
         //get an exising data from the list
         let child_data = this.subset[this.childptr]
         let child_subset = child_data.subset //if have a child subset, use the subset, else get undefined
         this.newchild(child_subset,child_data)
         return true;
    }
    one_step(){//do one step of DFS searching
         let move = false; //only one node can move

         //let the child(if can) do searching
         if(this.child === undefined){//for the leaves
              return true
         }else{//for other nodes
              move = move || this.child.one_step()
         }

         //if the child doesn't allow searching
         if(!move){return false}//then the higher nodes shouldn't move
         //if the child allows searching:
         if(this.childptr >= this.subset.length - 1 ){//when no unsearched child
              return true;//let higher nodes to move
         } else {// else let this node to move
              this.childptr ++;
              this.create_child();//create a new child
              return false;
         }
    }
    update() {//only change the data of the tree
          if(this.child !== undefined){//only when having child
               this.child.data = this.subset[this.childptr];//update one
               this.child.update();
          }
    }
    print(){
         console.log("->",this.data);
         if(this.child !== undefined){this.child.print()}
    }
    // more highlevel methods
    set_depth_limit(new_limit){
         if(this.depth !== 0){// safety handling 
              console.warn("please only set limit in the root node!");
         } 
         // else if(this.childptr !== 0){
         //      console.warn("this will reset all searching history!")
         // }
         this.depth_limit = new_limit;
         this.create_child();//refresh all child nodes
    }
    reset(){//reset all and all children
         this.childptr = 0
         this.create_child();
    }
     parse(){
         //1.locate the final leaf node
         let ptr = this;
         while(ptr.child !== undefined)
              ptr = ptr.child;

         //get the data of child
         let data_child = ptr.data;
         //special cases
         // we suppose only the lowest level should be checked
         if(data_child.tag === "value")
              data_child = data_child.val;
         else if(data_child.tag === "CommonExpressionValue")
              data_child = data_child.val;
         let data_parent;
         while(ptr.parent !== undefined && ptr.parent !== null  && ptr.parent.data.tag !== undefined){
              //get the data of parent
              data_parent = structuredClone( ptr.parent.data);
              //locate the space to fill
              let attributes = Object.keys(data_parent);
              let blank;
              attributes.forEach((attr)=>{
                   // console.log(data_parent[attr]);
                   if(data_parent[attr] === "__search__")
                        blank = attr;
              })
              //we don't allow search something but not use
              if(blank === undefined)console.error(
                   "cmd has subset but no blank space to be filled");
              //fill the blank space
              data_parent[blank] = data_child;
              delete data_parent.subset;
              //console.log("\ndata_parent",data_parent)
              data_child = data_parent;
              //to the upperlevel
              ptr = ptr.parent;
         }
         return data_child;
    }
    gen_result(){
     let result = [];
     let node = this;
     push(result,node.data);
     while(node.child !== undefined){
          node = node.child;
          push(result,node.data);
     }
     return result;
    }
    
}

class Enum_Forest{
    constructor(num,Set){
         this.num = num;// the number of nodes
         this.nodes = [];
         for(let i = 0; i< this.num; i++){
              this.nodes.push(new Enum_Node(null,Set,i)) 
         }
    }
    print(){
         for(let i = 0; i< this.num; i++){
              this.nodes[i].print();
         }
         console.log("######################")
    }
    one_step(){
         let move = true;//always regard node0 as leave
         for(let i=0; i<this.num;i++){
              if(move){
                   const move_next = this.nodes[i].one_step()//try to move this node
                   //if can't(return true), let next node to exceute
                   move = move && move_next
                   if(move_next){this.nodes[i].reset()}//and reset this node
              }
         }
         return move
    }
    parse(){
         let instr_set = [];
         for(let i = this.num-1;i>=0;i--){
               this.nodes[i].update()
               instr_set.push(this.nodes[i].parse())
         }
         return instr_set;
    }
    gen_result(){
     let new_F = Object.assign(this)
     for(let i = 0; i< this.num; i++)
          new_F.nodes[i] = new_F.nodes[i].gen_result()
     return new_F;
    }
    save_result(file_path){
     const result = this.gen_result();
     const data = JSON.stringify(result);
     fs.writeFile(file_path, data, (err) => {
          if (err) {
              throw err;
          }
          console.log("forest data is saved");
      });
     return result;
    }
}

/* help fuctions
 */
function obj_equal(A,B){
    //no-obj cases
    //times +=1 ;
    if(typeof(A) !== 'object'||typeof(B) !== 'object') return A===B;
    if(A === undefined || B=== undefined || A===null || B===null)  return A===B;
    //obj cases
    let A_attrs = Object.keys(A);
    let B_attrs = Object.keys(B);
    if(A_attrs.length !== B_attrs.length) return false;
    //we suppose the attributes have sequences
    let i = 0;
    while(i<A_attrs.length){
         //compare the name of attrs
         if(A_attrs[i]!==B_attrs[i]) return false;
         //special case
         if(A_attrs[i] === 'parent')continue;
         //recursively check the componets
         if(!obj_equal(A[A_attrs[i]],B[B_attrs[i]])) return false;
         i++;
    }
    return true;
}

function run_vm(i_S,i_A,i_E){
    let err = false;
    try{
         o_State = test_eval.run_seq(i_A,i_S,i_E);   
    }catch(e){
         err = true;
          // console.log(e);
         o_State = {S:i_S,A:test_eval.i_A,E:test_eval.i_E,ERR:err};
    }
    o_State.ERR = err;
    return o_State;
}

function run_compare(i_S,i_A,i_E,o_S,o_A,o_E){
    //run vm first
    run_output = run_vm(i_S,i_A,i_E);
    //error detection
    if(run_output.ERR === true)return false;
    t_S = run_output.S;
    t_A = run_output.A;
    t_E = run_output.E;
    return  !obj_equal(o_S,t_S)
           ?false
           :!obj_equal(o_A,t_A)
           ?false
         //   :true
         //currently there's some bug with E
           :!obj_equal(o_E,t_E)
           ?false
           :true;
}

exports.Node = Enum_Node
exports.Forest = Enum_Forest
exports.compare = run_compare
exports.run = run_vm