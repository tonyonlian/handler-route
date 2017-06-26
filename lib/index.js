const Async = require('async');
const Glob = require('glob');
const Path = require('path');
const Util = require('util'); 
const Hoek = require('hoek');
const Decorate = require('./decorate.js');
const ServerMethod = require('./method.js')
// rout config default value
let default_route_config = {
     tags:['api']
}

//默认日志输出
var _logger = function(name){
  return console;
}


exports.register = function (server, options, next) {
    //servrMathod
    for(var key in ServerMethod){
       let value = ServerMethod[key];
       server.method(key, value.method, value.options);
    }

    //decorate
    for(var key in Decorate){
       let value = Decorate[key];
       server.decorate(value.decorate, key, value.method, value.options); 
    }
    //context
    const bind = {
        message: 'hello',
        getLogger:function(name){
            let _logplugin = server.plugins['light-api-log'];
            if(_logplugin && _logplugin.serivce &&  _logplugin.serivce.logger(name)){
                return _logplugin.serivce.logger(name);
            }else{
                return _logger(name);
            }
        },
        getPlugin:function(plugsName){
            return server.plugins[plugsName].serivce;
        },
        getConfig:function(key){
            return server.settings.app[key];
        },
        getMime:function(filename){
            return server.mime.path(filename).type;
        }
    };
    server.bind(bind);


    //routes
    const isArray = Array.isArray || function (arr) {
        return {}.toString.call(arr) === '[object Array]';
    };

    const cast = (value) => {
        return isArray(value) ? value : [value];
    };

    const globtions = {
        nodir: true,
        strict:true,
        ignore: options.ignores && cast(options.ignores) || [],
        cwd: options.relativeTo || process.cwd()
    }

    Async.each(cast(options.servers),(pattern,nextPattern) =>{
        const matches = Glob.sync(pattern,globtions);
        if(matches.length == 0){
            return nextPattern();//nextPattern('No service files found for pattern ' + pattern);
        }
       
        Async.each(matches, (match,nextMatch) =>{
            const route = require(globtions.cwd + '/' + match);
            //注入文档配置 -start
            if(Util.isArray(route)){
                route.forEach(function(item){
                    if(item.config){
                        let options = Hoek.applyToDefaults(default_route_config, item.config);
                        item.config = options;
                     }else{
                        item.config = default_route_config; 
                    }
                });
            }else{
                if(route.config){
                  let options = Hoek.applyToDefaults(default_route_config, route.config);
                  route.config = options;
                }else{
                  route.config = default_route_config;
                }
            }
            //注入文档配置 -end

            server.route(route.default || route)
            return nextMatch();
        },(err) =>{

             return nextPattern(err);
        })
      
    },(err)=>{

       return next(err);

    });

};

exports.register.attributes = {
    pkg: require('../package.json')
  
};