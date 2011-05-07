bounding = require('../maths/bounding');
fs = require('fs');
path = require('path');

MODELSOURCEDIR = '../assets/models';
MODELDESTDIR = '../data/models';

fs.readdir(MODELSOURCEDIR, function(err, files){
    for(var i = 0 ; i < files.length; i++){        
     var pathToFile = path.join(MODELSOURCEDIR, files[i]);
     var modelName = files[i].substr(0, files[i].length - 3);
     console.log('Processing ' + pathToFile + ' for model: ' + modelName);
        
     fs.readFile(pathToFile, function(err, data) {
           data += '\n' + ' BlenderExport["' + modelName + '"];';           
           var model = eval(data);             
           
           processModel(model);
           
           var modelData = JSON.stringify(model);
              
           var pathToNewFile = path.join(MODELDESTDIR, modelName + '.js');
           fs.writeFile(pathToNewFile, modelData, function (err) {
               
               if(err){
                console.log(err);   
               }else
               {
                console.log('Processed ' + pathToNewFile);
               }
           });           
        });
    }    
});

processModel = function(model){  
  model.Box = bounding.Box.Create(model.vertices);
  model.Sphere = bounding.Sphere.Create(model.vertices,  model.Box);

  
  console.log('Calculated sphere: ' + JSON.stringify(model.Sphere));
  console.log('Calculated Box: ' + JSON.stringify(model.Box));
};