exports.Docs = [
  {
     "_id": "_design/users",
     "language": "javascript",
     "views": {
         "by_username": {
             "map": "function(doc) {\n  if(doc.type !== 'user') return;\n  emit(doc.username, doc);\n}"
         },
         "by_email": {
             "map": "function(doc) {\n  emit(doc.email, doc);\n}"
         },
         "by_totalscore": {
             "map": "function(doc) {\n  if(doc.type !== 'user') return;\n  if(doc.totalscore === undefined) return;\n  if(doc.totalkills === undefined) return;\n  if(doc.totaldeaths === undefined) return;\n  emit([doc.totalscore], {\n     username: doc.username,\n     totalscore: doc.totalscore,\n     totalkills: doc.totalkills,\n     totaldeaths: doc.totaldeaths\n  });\n}"
         }
     }
  },
  {
     "_id": "_design/stats",
     "language": "javascript",
     "views": {
         "score": {
             "map": "function(doc) {\n  if(doc.eventType === 'playerScoreIncreased')\n   emit(doc.data.username, 1);\n  else if(doc.eventType === 'playerScoreDecreased')\n   emit(doc.data.username, -1);\n}",
             "reduce": "function(key, items) {\n  return sum(items);\n}"
         },
         "kills": {
             "map": "function(doc) {\n  if(doc.eventType === 'playerKilled')\n   emit(doc.data.sourceuser, 1);\n}",
             "reduce": "function(key, items) {\n  return sum(items)\n}"
         },
         "deaths": {
             "map": "function(doc) {\n  if(doc.eventType === 'playerKilled')\n   emit(doc.data.targetuser, 1);\n}",
             "reduce": "function(key, items) {\n  return sum(items)\n}"
         }
     }
  }
];
