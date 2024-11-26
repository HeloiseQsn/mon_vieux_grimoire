const jwt = require('jsonwebtoken');
//vérification de la validité du token 

module.exports = (req, res, next) => {
   try {
       const token = req.headers.authorization.split(' ')[1]; //on récupère le token du headers dans la requête 
       const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET'); //comparaison du token et du RANDOM TOKEN SECRET
       const userId = decodedToken.userId; //si ok, on récupère le userID qu'on ajoute dans l'objet req.auth pour le rendre dispo dans les routes et middlewares suivants
       req.auth = {
           userId: userId 
       };
	next();
   } catch(error) {
       res.status(401).json({ error });
   }
};