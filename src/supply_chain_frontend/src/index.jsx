import { createActor, supply_chain_backend } from "../../declarations/supply_chain_backend";
import { AuthClient } from "@dfinity/auth-client"
import { HttpAgent } from "@dfinity/agent";
import * as React from 'react';
import { render } from 'react-dom';
import React, { useState } from 'react';






class SupplyChain extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      actor: supply_chain_backend,
      file: null,
      drafts: [{ id: '', title: '' }],
      currentDraft: {
        id: 0,
        title: '',
        nextOwner: { userName: '', userId: '' },
        labelToText: [{ label: '', text: '' }],
        previousNodesIDs: [0],
        draftFile: [""]
      }, 
      currentNode: {
        id: 0,
        title: '',
        owner: { userName: '', userId: '' },
        nextOwner: { userName: '', userId: '' },
        labelToText: [{ label: '', text: '' }],
        files: [""]
      }
    };
  }


  handleAddField = () => {
    const { labelToText } = this.state.currentDraft;
    const newLabelToText = [...labelToText, { label: '', text: '' }];
    this.setState({
      currentDraft: {
        ...this.state.currentDraft,
        labelToText: newLabelToText
      }
    });
  };


  handleRemoveField = (index) => {
    const { labelToText } = this.state.currentDraft;
    const newLabelToText = [...labelToText];
    newLabelToText.splice(index, 1);
    this.setState({
      currentDraft: {
        ...this.state.currentDraft,
        labelToText: newLabelToText
      }
    });
  };

  handleFieldChange = (index, fieldName, event) => {
    const { labelToText } = this.state.currentDraft;
    const newLabelToText = [...labelToText];
    newLabelToText[index][fieldName] = event.target.value;
    this.setState({
      currentDraft: {
        ...this.state.currentDraft,
        labelToText: newLabelToText
      }
    });
  };

  handleNextOwnerChange = (event) => {
    const newNextOwner = event.target.value;
    this.setState({
      currentDraft: {
        ...this.state.currentDraft,
        nextOwner: {
          ...this.state.currentDraft.nextOwner,
          userId: newNextOwner
        }
      }
    });
  };

  handleChildNodesChange = (event) => {
    const newChildNodesS = event.target.value;
    let newChildNodes = newChildNodesS.split(',').map(function (item) {
      return parseInt(item, 10);
    });
    this.setState({
      currentDraft: {
        ...this.state.currentDraft,
        previousNodesIDs: newChildNodes

      }
    });
  };

  async getNodeById() {

    let idInput = document.getElementById("nodeId");
    let idValue = BigInt(idInput.value);

    let nodeExists = await this.state.actor.checkNodeExists(idValue);


    if (nodeExists){
      let node = await this.state.actor.getNodeById(idValue); // maybe cast in BigInt
      console.log(node);
      const { currentNode } = this.state;
      currentNode.id = idInput;
      currentNode.title = node[0];
      currentNode.owner = node[1];
      currentNode.nextOwner = node[2];
      currentNode.labelToText = node[3].map(([label, text]) => ({
        label,
        text
      }));
      currentNode.files = node[4];
      this.setState({ currentNode: currentNode });
  
      this.loadImage(currentNode.files,false);
    } else {
      alert("invalid node id");
    }
  
    

  }

  showNode() {

    const tmpNode = this.state.currentNode;

    if (tmpNode.id != 0) {
      return (
      <div><h1>{tmpNode.title}</h1>
       
              <label>Owner ID:</label><label>{tmpNode.owner.userId}</label>
              <br></br>
              <label>Next Owner ID:</label><label>{tmpNode.nextOwner.userId}</label>
       
        <div>

          {(tmpNode.labelToText || []).map((field, index) => (
            <div>
              <label>{field.label}:  </label>
              <label>{field.text}</label>
            </div>

          ))}
        
        </div>
        <h4>Files</h4>
        <section>
          <section id="nodeImage"></section>
        </section>
      </div>)
    }

  }


  async finalizeNode() {
    let response = await this.state.actor.createLeafNode(this.state.currentDraft.id);
    alert(response);
    this.state.currentDraft = {
      id: 0,
      title: '',
      nextOwner: { userName: '', userId: '' },
      labelToText: [{ label: '', text: '' }],
      previousNodesIDs: [0],
      draftFile: [""]
    }
  }

  async saveDraft() {

    if (this.state.file) {
      await this.upload();
    }

    const { currentDraft } = this.state;


    // Construct Arguments to send to backend canister
    const currentD = [
      BigInt(currentDraft.id),
      { userName: currentDraft.nextOwner.userName, userId: currentDraft.nextOwner.userId },
      currentDraft.labelToText.map(({ label, text }) => [label, text]),
      currentDraft.previousNodesIDs,
      currentDraft.draftFile,
    ];

    let response = await this.state.actor.saveToDraft(...currentD);
    alert(response);
  }




  async getCaller() {
    document.getElementById("ii").value = this.state.actor.getCaller();
  }

  async addSupplier() {
    let userName = document.getElementById("newSupplierName");
    let userID = document.getElementById("newSupplierID");
    const supplier = {
      userName: userName.value,
      userId: userID.value,

    }
    let response = await this.state.actor.addSupplier(supplier);

    userName.value = "";
    userID.value = "";
    alert(response)
    this.showCreateDraft()
 
  }

  async createNode() {
    const caller = await this.state.actor.getCaller();

    // let title = document.getElementById("newNodeTitle");
    // let nextOwnerID = document.getElementById("newNodeNextOwner");
    // let children = document.getElementById("newNodeChildren");

    const title = this.state.currentDraft;
    const children = children.value;
    const nextOwner = nextOwnerID.value;
    // title.value = "";
    // children.value = "";
    // nextOwnerID.value = "";
    let response = "";
    if (title.length > 0) {
      //Check if there are any child nodes. If not, the node is a "rootnode", which is a node without children
      if (children.length == 0) {
        response += await this.state.actor.createLeafNode([0], title, caller, nextOwner);
      } else {
        //Split child node IDs by ","
        let numbers = children.split(',').map(function (item) {
          return parseInt(item, 10);
        });
        response += await this.state.actor.createLeafNode(numbers, title, caller, nextOwner);
      }

      if (caller === "2vxsx-fae") {
        response = "Node was not created. Login to a supplier account to create nodes."
      }
      alert(response)
      //document.getElementById("createResult").innerText = response;
    }
  }

  async createDraftNode() {
    const caller = await this.state.actor.getCaller();
    let response = "";
    if (caller === "2vxsx-fae") {
      response = "Node was not created. Login to a supplier account to create nodes."
    } else {

      let title = document.getElementById("newNodeTitle");

      const tValue = title.value;

      title.value = "";

      
      if (tValue.length > 0) {
        //Check if there are any child nodes. If not, the node is a "rootnode", which is a node without children

        let response = await this.state.actor.createDraftNode(tValue);
        alert(response)
        this.getDraftBySupplier()
        
      }
    }

  
  }

  async getDraftBySupplier() {
    let isSupplier = this.state.actor.isSupplierLoggedIn();
    let myElement = document.getElementById("draftsList");
    if(isSupplier){

      let result = await this.state.actor.getDraftsBySupplier();
      myElement.style.display = "block"; // Show the element

      let tempDrafts = [];
      result.forEach((d) => {
        tempDrafts = [...tempDrafts, { id: Number(d[0]), title: d[1] }]
  
      });
      this.setState({ drafts: tempDrafts });
      console.log(this.state.drafts)
    } else {
      myElement.style.display = "none";
    }
    

  }
  async login() {


    let authClient = await AuthClient.create();


    await new Promise((resolve) => {
      authClient.login({
        identityProvider: process.env.II_URL,
        onSuccess: resolve,
      });
    });

    // At this point we're authenticated, and we can get the identity from the auth client:
    const identity = authClient.getIdentity();

    console.log(identity);
    // Using the identity obtained from the auth client, we can create an agent to interact with the IC.
    const agent = new HttpAgent({ identity });
    // Using the interface description of our webapp, we create an actor that we use to call the service methods. We override the global actor, such that the other button handler will automatically use the new actor with the Internet Identity provided delegation.
    this.state.actor = createActor(process.env.SUPPLY_CHAIN_BACKEND_CANISTER_ID, {
      agent,
    });
    const greeting = await this.state.actor.greet();
    document.getElementById("greeting").innerText = greeting;

    this.getDraftBySupplier();
    this.showCreateDraft();
    this.showAddSupplier();
    return false;

  }





  async getNodes() {
    let all = await this.state.actor.showAllNodes();
    document.getElementById("allNodes").innerHTML = all;
  }
  async getSuppliers() {
    let all = await this.state.actor.getSuppliers();
    document.getElementById("suppliers").innerHTML = all;
    
  }
  async getChildNodes() {
    let tree = document.getElementById("parentId");
    const tValue = parseInt(tree.value, 10);
    if (tValue >= 0) {
      let nodes = await this.state.actor.showAllChildNodes(tValue);
      nodes = nodes.replace(/\n/g, '<br>');
      console.log("Nodes:" + nodes)
      if (nodes === "") { nodes = "No child nodes found" }
      document.getElementById("treeResult").innerHTML = nodes;
    } else {
      document.getElementById("treeResult").innerHTML = "Error: Invalid ID"
    }
  }




  // Upload and download code was taken by dfinity's example project and was adapted to this project
  // https://github.com/carstenjacobsen/examples/tree/master/motoko/fileupload
  async handleFileSelection(event) {
    this.state.file = event.target.files[0];
    console.log(this.state.file)

  }

  async upload() {

    if (!this.state.file) {
      alert('No file selected');
      return;
    }

    const { currentDraft } = this.state;

    let newName = this.state.file.name.replace(/\s/g, ""); // remove whitespaces so no error occurs in the GET method URL
    this.state.file = new File([this.state.file], newName, { type: this.state.file.type });
    console.log(this.state.file);



    console.log('start upload');

    const batch_name = this.state.file.name;
    const promises = [];
    const chunkSize = 1500000; //Messages to canisters cannot be larger than 2MB. The chunks are of size 1.5MB

    for (let start = 0; start < this.state.file.size; start += chunkSize) {

      // Create a chunk from file in size defined in chunkSize
      const chunk = this.state.file.slice(start, start + chunkSize); // returns a Blob obj
      console.log(chunk);

      // Fill array with the uploadChunkt function. The array be executed later
      // "uploadChunk" takees the batch_name(file name) and the chunk
      promises.push(this.uploadChunk({
        batch_name,
        chunk
      }));
    }

    // Executes the "uploadChunk" defined in the promises array. Returns the chunkIDs created in the backend
    const chunkIds = await Promise.all(promises);

    console.log(chunkIds);

    const node_id = BigInt(currentDraft.id)

    //Finish upload by commiting file batch to be saved in backend canister with the current node ID
    await this.state.actor.commit_batch({
      node_id,
      batch_name,
      chunk_ids: chunkIds.map(({ chunk_id }) => chunk_id),
      content_type: this.state.file.type
    })

    console.log('uploaded');

    const assetKey = [...currentDraft.draftFile, "/" + currentDraft.id + "/assets/" + batch_name]
    this.setState({
      currentDraft: {
        ...this.state.currentDraft,
        draftFile: assetKey
      }
    });


    // Once the files has been saved in the backend canister it can be loaded to be seen on the frontend
    this.loadImage(currentDraft.draftFile, true);
  }

  // Takes a record of batch_name and chunk
  // calls the backend canister method "create_chunk"
  //converts chunk of type Blob into a Uint8Array to send it to backend canister. Motoko reads it as [Nat8]
  async uploadChunk({ batch_name, chunk }) {
    return this.state.actor.create_chunk({
      batch_name,
      content: [...new Uint8Array(await chunk.arrayBuffer())]
    });
  }



  loadImage(files, isDraft) {
    if (!files) {
      return;
    }


    const section = isDraft? document.querySelector('#draftImage'): document.querySelector('#nodeImage');

    // Create a document fragment to hold the image tags
    const fragment = document.createDocumentFragment();

    // Iterate over the image sources and create image tags
    files.forEach((src) => {
      const img = document.createElement('img');
      img.width = 300;
      img.height = 200;
      console.log(src);
      img.src = `http://localhost:4943${src}?canisterId=ryjl3-tyaaa-aaaaa-aaaba-cai`;
      fragment.appendChild(img);
    });

    // Append the fragment to the section element
    section?.appendChild(fragment);
  }

  async setCurrentDraft(id) {
    let draft = await this.state.actor.getDraftById(id);
    console.log(draft);
    const { currentDraft } = this.state;
    currentDraft.id = Number(draft[0]);
    currentDraft.title = draft[1];
    currentDraft.nextOwner = draft[2];
    currentDraft.labelToText = draft[3].map(([label, text]) => ({
      label,
      text
    }));
    currentDraft.previousNodesIDs = draft[4];
    currentDraft.draftFile = draft[5];
    this.setState({ currentDraft: currentDraft });

    this.loadImage(currentDraft.draftFile, true);

  }
  showDraft() {

    const tmpDraft = this.state.currentDraft;

    if (tmpDraft.id != 0) {
      return (<div><h1>Complete "{tmpDraft.title}" Draft</h1>
        <table>
          <tbody>
            <tr>
              <td>Next Owner ID:</td><td><input value={tmpDraft.nextOwner.userId} onChange={(event) => this.handleNextOwnerChange(event)}></input></td>
              <td>Child nodes:</td><td><input value={tmpDraft.previousNodesIDs} onChange={(event) => this.handleChildNodesChange(event)} placeholder="1,2,..."></input></td>
            </tr>
          </tbody>
        </table>
        <div>

          {(tmpDraft.labelToText || []).map((field, index) => (
            <div key={index}>
              <input
                type="text"
                value={field.label}
                onChange={(event) => this.handleFieldChange(index, 'label', event)}
              />
              <input
                type="text"
                value={field.text}
                onChange={(event) => this.handleFieldChange(index, 'text', event)}
              />

              {(
                <button type="button" onClick={() => this.handleRemoveField(index)}>
                  Remove Field
                </button>
              )}
            </div>

          ))}
          <button type="button" onClick={() => this.handleAddField()}>
            Add Field
          </button>


        </div>
        <h4>Upload file</h4>
        <section>
          <label for="image">Image:</label>
          <input id="image" alt="image" onChange={(e) => this.handleFileSelection(e)} type="file" accept="image/x-png,image/jpeg,image/gif,image/svg+xml,image/webp,image/*,.pdf" />
          {/* <button className="upload" onClick={() => this.upload()}>Upload</button> */}
          <section id="draftImage"></section>
        </section>

        <button type="button" onClick={() => this.saveDraft()}>
          Save
        </button>
        <button type="button" onClick={() => this.finalizeNode()}>
          Finalize
        </button>
      </div>)
    }

  }

  async showAddSupplier() {
    let hasAccess = await this.state.actor.canAddNewSupplier();
    let myElement = document.getElementById("addSupplier");
    console.log("Add supplier "+hasAccess);
    if (hasAccess) {
       myElement.style.display = "block"; // Show the element
    } else {
      myElement.style.display = "none"; 
   } 
  
  }

  async showCreateDraft(){
    let supplierLoggedIn = await this.state.actor.isSupplierLoggedIn();
    let myElement = document.getElementById("createDraftBlock");
    if (supplierLoggedIn) {
       myElement.style.display = "block"; // Show the element
    } else {
      myElement.style.display = "none"; 
   } 
  
  }


  render() {
    const { drafts } = this.state;
    return (
      <div>
        <h1>Supply Chain</h1>
        <button type="submit" id="login" onClick={() => this.login()}>Login</button>
        <h2 id="greeting"></h2>
        <div id="addSupplier" style={{display: "none"}} >
          <h3> Add supplier</h3>
          <table>
            <tbody>
              <tr>

                <td>user id:</td><td><input required id="newSupplierID"></input></td>
                <td>username :</td><td><input required id="newSupplierName"></input></td>
              </tr>
            </tbody>
          </table>
          <button onClick={() => this.addSupplier()}>Create Supplier</button>
          <div id="supplierResponse"></div>
          <br></br>
        </div>
        <div>  
        <button onClick={() => this.getNodes()}>Get all nodes</button>
        <div id="allNodes"></div>
        <br></br>
        <p>Get node by Id:</p>
        <input type="number" required id="nodeId"></input>
        <button onClick={() => this.getNodeById()}>Get Node</button>
        <br></br>
        {this.showNode()}
        <br></br>
        <div>
          <p> Get Chain by last node ID</p>
          <table>
            <tbody>
              <tr>
                <td>Last node ID:</td><td><input type="number" required id="parentId"></input></td>
              </tr>
            </tbody>
          </table>
          <button onClick={() => this.getChildNodes()}>Show Child Nodes</button>
          <div id="treeResult"></div>
        </div>
        <br></br>
        <button onClick={() => this.getSuppliers()}>Get all suppliers</button>
        <div id="suppliers"></div>
        <br></br>
        <div id="draftsList" style={{display: "none"}}>
         <h4>My drafts</h4>
         {drafts.length == 0 &&(
           <div>No drafts created</div>
         )}
          {/* <button type="button" onClick={() => this.getDraftBySupplier()}>
            Get my drafts
          </button> */}
        {drafts.length > 0 &&(
          <div>
            {drafts.map((draft, index) => (
              <div key={index}>
                <label>{draft.title}</label>
                <button type="button" onClick={() => this.setCurrentDraft(draft.id)}>
                  Edit draft
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
          
         
        </div>
      


        <div id="createDraftBlock" style={{display: "none"}}>
            <h3>Create Draft node:</h3>
            <table>
              <tbody>
                <tr>
                  <td>Title:</td><td><input required id="newNodeTitle"></input></td>
                </tr>
              </tbody>
            </table>
            <button onClick={() => this.createDraftNode()}>Create Draft Node</button>
            <div id="createResult"></div>  
          <br></br>
        </div>
    
      
        <div>{this.showDraft()}</div>
      </div>
    );
  }
}

render(<SupplyChain />, document.getElementById('create_node'));
