import React,{Component} from "react";
import jQuery from "jquery";
import './XlogFlow.css'
import {connect} from 'react-redux';
import {withRouter} from 'react-router-dom';
import XlogFlowChart from './XlogFlowChart/XlogFlowChart'
import XlogFlowRender from './XlogFlowChart/XlogFlowRender'
import DependencyElement from "./DependencyElement";

import {getCurrentUser, getHttpProtocol, getWithCredentials, setAuthHeader} from "../../../../../../common/common";
import {addRequest, setControlVisibility} from "../../../../../../actions";
import * as _ from "lodash";
import moment from "moment/moment";


// const url=`/scouter/v1/xlog-data/${yyyymmdd}/gxid/${gxid}`;

const XLogTypes= {
    WEB_SERVICE : "WEB_SERVICE",
    APP_SERVICE : "APP_SERVICE",
    BACK_THREAD : "BACK_THREAD",
    ASYNCSERVLET_DISPATCHED_SERVICE : "ASYNCSERVLET_DISPATCHED_SERVICE",
    BACK_THREAD2 : "BACK_THREAD2",
    ZIPKIN_SPAN : "ZIPKIN_SPAN",
    UNKNOWN : "UNKNOWN",

    toNumber(value="UNKNOWN"){
        switch(value){
            case this.WEB_SERVICE : return 0;
            case this.APP_SERVICE : return 1;
            case this.BACK_THREAD : return 2;
            case this.ASYNCSERVLET_DISPATCHED_SERVICE : return 3;
            case this.BACK_THREAD2 : return 4;
            case this.ZIPKIN_SPAN : return 5;
            default:
                return 99;
        }
    }
};
const Steps = {
    METHOD : "1",
    METHOD2 : "10",
    SPAN : "51",
    SQL : "2",
    SQL2 : "8",
    SQL3 : "16",
    MESSAGE : "3",
    SOCKET : "5",
    APICALL : "6",
    APICALL2 : "15",
    SPANCALL : "52",
    THREAD_SUBMIT : "7",
    HASHED_MESSAGE : "9",
    PARAMETERIZED_MESSAGE : "17",
    DUMP : "12",
    DISPATCH : "13",
    THREAD_CALL_POSSIBLE : "14",
    METHOD_SUM : "11",
    SQL_SUM : "21",
    MESSAGE_SUM : "31",
    SOCKET_SUM : "42",
    APICALL_SUM : "43",
    CONTROL : "99",

    toString(value){
        switch (value) {
            case this.METHOD : return "METHOD";
            case this.METHOD2 : return "METHOD2";
            case this.SPAN : return "SPAN";
            case this.SQL : return "SQL";
            case this.SQL2 : return "SQL2";
            case this.SQL3 : return "SQL3";
            case this.MESSAGE : return "MESSAGE";
            case this.SOCKET : return "SOCKET";
            case this.APICALL : return "APICALL";
            case this.APICALL2 : return "APICALL2";
            case this.SPANCALL : return "SPANCALL";
            case this.THREAD_SUBMIT : return "THREAD_SUBMIT";
            case this.HASHED_MESSAGE : return "HASHED_MESSAGE";
            case this.PARAMETERIZED_MESSAGE : return "PARAMETERIZED_MESSAGE";
            case this.DUMP : return "DUMP";
            case this.DISPATCH : return "DISPATCH";
            case this.THREAD_CALL_POSSIBLE : return "THREAD_CALL_POSSIBLE";
            case this.METHOD_SUM : return "METHOD_SUM";
            case this.SQL_SUM : return "SQL_SUM";
            case this.MESSAGE_SUM : return "MESSAGE_SUM";
            case this.SOCKET_SUM : return "SOCKET_SUM";
            case this.APICALL_SUM : return "APICALL_SUM";
            case this.CONTROL : return "CONTROL";

        }
    },
    toElapsedTime(step){
        switch (step.stepType) {
            case this.HASHED_MESSAGE :
                return Number(step.time) >= 0 ? Number(step.time) : 0;
            case this.DUMP :
            case this.MESSAGE_SUM :
            case this.CONTROL :
                return 0;
            case this.SQL3 :
            case this.SQL :
            case this.SQL2:
            case this.METHOD :
            case this.SPAN :
            case this.SPANCALL :
            case this.METHOD2 :
            case this.MESSAGE :
            case this.SOCKET :
            case this.APICALL :
            case this.APICALL2 :
            case this.THREAD_SUBMIT :
            case this.PARAMETERIZED_MESSAGE :
            case this.DISPATCH :
            case this.THREAD_CALL_POSSIBLE :
            case this.METHOD_SUM :
            case this.SQL_SUM :
            case this.SOCKET_SUM :
            case this.APICALL_SUM :
                return Number(step.elapsed);
            default :
                return Number(step.elapsed);
        }

    }
};

const ElementType = {
    USER : "0",
    SERVICE : "1",
    API_CALL : "2",
    SQL : "3",
    DISPATCH : "4",
    THREAD : "5",

    toString(value) {
        switch(value){
            case this.USER : return "USER";
            case this.SERVICE : return "SERVICE";
            case this.API_CALL : return "API_CALL";
            case this.SQL : return "SQL";
            case this.DISPATCH : return "DISPATCH";
            case this.THREAD : return "THREAD";
            default:
                return "UNKNOWN";
        }
    }
};

class XlogFlow extends Component {

    state = {
        data: []
    };

    constructor(props) {
        super(props);

    };
    componentDidMount() {
        // console.log("componentDidMount");
        //- first create event
        window.addEventListener("resize", this.resize);
        this.loadByGxId();
    }

    componentWillUnmount(){

    }

    componentWillReceiveProps(nextProps){
        console.log("componentWillReceiveProps");
    }

    resize = () =>{

    };
    stringTruncate(str,len){
        return !str || str.length <= len ? str : str.substring(0, len);
    }
    toDependencyElement(type,id){
        return new DependencyElement({type : type , id : id});
    }
    stepToElement(serviceMap,thisElement,steps){
        const {stepType} = steps.step;
        const {step,mainValue} = steps;
        switch(stepType){
            case Steps.APICALL:
            case Steps.APICALL2:
                const apiElement = this.toDependencyElement(ElementType.API_CALL, step.txid + step.hash);
                apiElement.elapsed= Steps.toElapsedTime(step);
                apiElement.error = step.error;
                apiElement.name = mainValue;
                apiElement.address = step.address;
                if(step.txid !== "0"){
                    //other call check 
                    const callElement = serviceMap.get(step.txid);
                    if(callElement){
                        callElement.serviceElement.address = step.address;
                        thisElement.addChild(callElement.serviceElement);
                    }else{
                        thisElement.addChild(apiElement);
                    }
                }else{
                    thisElement.addChild(apiElement);
                }
                break;
            case Steps.SPANCALL:
                const  spanCallElement = this.toDependencyElement(ElementType.API_CALL, step.txid + step.hash);
                spanCallElement.elapsed = Steps.toElapsedTime(step);
                spanCallElement.error = step.error;
                spanCallElement.name = mainValue;
                spanCallElement.address = step.address;
                if (step.txid !== "0") {
                    const callElement = serviceMap.get(step.txid);
                    if (callElement) {
                        callElement.serviceElement.address = step.address;
                        thisElement.addChild(callElement.serviceElement);
                    } else {
                        thisElement.addChild(spanCallElement);
                    }
                } else {
                    thisElement.addChild(spanCallElement);
                }                
                break;
            case Steps.DISPATCH:
                const dispatchElement = this.toDependencyElement(ElementType.DISPATCH, step.txid + step.hash);
                dispatchElement.elapsed = Steps.toElapsedTime(step);
                dispatchElement.error = step.error;
                dispatchElement.name = mainValue
                if (step.txid !== "0") {
                    const callElement = serviceMap.get(step.txid);
                    if (callElement) {
                        thisElement.addChild(callElement.serviceElement);
                    } else {
                        thisElement.addChild(dispatchElement);
                    }
                } else {
                    thisElement.addChild(dispatchElement);
                }
                break;
            case Steps.THREAD_CALL_POSSIBLE:
                //- other thread call checking
                const tcElement = this.toDependencyElement(ElementType.DISPATCH, step.txid + step.hash);
                tcElement.elapsed = Steps.toElapsedTime(step);
                tcElement.name = mainValue;
                if (step.txid !== "0") {
                    const callElement  = serviceMap.get(step.txid);
                    if (callElement) {
                        thisElement.addChild(callElement.serviceElement);
                    } else {
                        thisElement.addChild(tcElement);
                    }
                } else {
                    thisElement.addChild(tcElement);
                }
                break;
            case Steps.APICALL_SUM:
                const apiSumElement = this.toDependencyElement(ElementType.API_CALL, step.hash);
                apiSumElement.dupleCnt = step.count;
                apiSumElement.elapsed = Steps.toElapsedTime(step);
                apiSumElement.error = step.error;
                apiSumElement.name = mainValue;
                thisElement.addChild(apiSumElement);
                break;
            case Steps.SQL:
            case Steps.SQL2:
            case Steps.SQL3:
                const sqlElement = this.toDependencyElement(ElementType.SQL, step.hash);
                sqlElement.elapsed = Steps.toElapsedTime(step);
                sqlElement.name =  `${this.stringTruncate(mainValue, 20)}...`;
                sqlElement.error = step.error;
                sqlElement.tags.sql = mainValue;
                thisElement.addChild(sqlElement);
                break;
            case Steps.SQL_SUM:
                const sqlSumElement = this.toDependencyElement(ElementType.SQL, step.hash);
                sqlSumElement.dupleCnt = step.count;
                sqlSumElement.elapsed = Steps.toElapsedTime(step);
                sqlSumElement.error = step.error;
                sqlSumElement.name =  `${this.stringTruncate(mainValue, 20)}...`;
                sqlSumElement.tags.sql=mainValue;
                thisElement.addChild(sqlSumElement);
                break;
            // case Steps.THREAD_SUBMIT:
            //     -analys
            //     break;
        }
    }
    flowOrder(globalTracing,serviceMap,objects){
       return globalTracing.map(_global => {
            let excludeObjName = false;
            let eType = ElementType.SERVICE;
            switch(_global.xlogType){
                case XLogTypes.WEB_SERVICE:
                    eType = ElementType.DISPATCH;
                    excludeObjName = true;
                    break;
                case XLogTypes.BACK_THREAD2:
                    excludeObjName = true;
                    eType = ElementType.THREAD;
                    break;
            }
            const serviceElement = new DependencyElement({type:eType , id : _global.txid});
            if(excludeObjName) {
                serviceElement.name = _global.service;
            } else {
                const _object = objects.get(_global.objHash);

                const _name = _object.objName ? _object.objName : 'unknown';
                serviceElement.name =  `${_global.service}\n(" ${_name} ")`;
            }

            serviceElement.elapsed      = new Number(_global.elapsed);
            serviceElement.error        = _global.error;
            serviceElement.threadName   = _global.threadName;
            serviceElement.xtype        = _global.xlogType;
            serviceElement.tags = {
                caller: _global.caller,
                ip: _global.ipAddr
            };

           serviceMap.set(_global.txid, {
                serviceElement : serviceElement
            });

            return {
                txid : _global.txid
            };
        });
    }
    tryDepFlowSearch(globalTracing){
        //next try step
        const {config, user} = this.props;
        const _allofTrace = globalTracing.map(_tx =>{
            const yyyymmdd = moment(new Date(Number(_tx.endTime))).format("YYYYMMDD");
            const _url = `${getHttpProtocol(config)}/scouter/v1/profile-data/${yyyymmdd}/${_tx.txid}`;
            return jQuery.ajax({
                method: "GET",
                async: true,
                // dataType: 'text',
                dataType: "json",
                url: _url,
                xhrFields: getWithCredentials(config),
                beforeSend: (xhr)=>{
                    setAuthHeader(xhr, config, getCurrentUser(config, user));
                }
            });
        });
        const _allofObject = this.props.config.servers.filter(_server =>_server.default)
                                        .map(_server =>{
                                            return jQuery.ajax({
                                                method: "GET",
                                                async: true,
                                                dataType: "json",
                                                url: `${getHttpProtocol(this.props.config)}/scouter/v1/object?serverId=${_server.id}`,
                                                xhrFields: getWithCredentials(this.props.config),
                                                beforeSend: (xhr) =>{
                                                    setAuthHeader(xhr, this.props.config, getCurrentUser(this.props.config, this.props.user));
                                                }
                                            });
                                        });
        const _objects = new Map();
        const _serviceMap = new Map();
        const _stepMap = new Map();
        const _rootMap = new Map();
        jQuery.when(_allofObject[0],..._allofTrace)
              .done((fullObject,...fullTrace)=> {
               try{

                   fullObject.forEach(_res => {
                       _.forEach(_res.result,(_obj) =>_objects.set(_obj.objHash,_obj));
                  });

                   const _order = this.flowOrder(globalTracing,_serviceMap,_objects);
                   let index = 0;
                   fullTrace.forEach(_res =>{
                       _stepMap.set(_order[index].txid,_res[0].result);
                       index++;
                   });
//-- iter
                   _order.forEach(_tx =>{
                       const {txid} = _tx;
                       const {serviceElement} = _serviceMap.get(txid);
                       if(!serviceElement){
                           return;
                       }
                       const steps = _stepMap.get(txid);
                       if(!steps){
                           return;
                       }
                       steps.forEach(_step => this.stepToElement(_serviceMap,serviceElement,_step));
                       if( _serviceMap.size  === 1 || serviceElement.tags.caller === "0"){
                           const {ip} = serviceElement.tags;
                           if(ip){
                               let ipElement = _rootMap.get(ip);
                               if(!ipElement){
                                   ipElement = this.toDependencyElement(ElementType.USER,ip);
                                   ipElement.name = ip;
                                   _rootMap.set(ip, ipElement);
                               }
                               ipElement.addChild(serviceElement);
                           }else{
                               const dummyElement = this.toDependencyElement(ElementType.USER,new Date().getTime());
                               dummyElement.name = "???.???.???.???";
                               _rootMap.put(dummyElement.id, dummyElement);
                           }
                       }
                   });
                   console.log(_rootMap);
               }catch (e) {
                   console.log(e);
               }
            })
    }

    loadByGxId(){
        this.props.setControlVisibility("Loading", true);
        this.props.addRequest();
        const {config, user,flow } = this.props;
        // console.log("loadByGxId",flow,user);
        const _url = `${getHttpProtocol(config)}/scouter/v1/xlog-data/${flow.parameter.yyyymmdd}/gxid/${flow.parameter.gxid}`;
        jQuery.ajax({
            method: "GET",
            async: true,
            dataType: 'text',
            url: _url,
            xhrFields: getWithCredentials(config),
            beforeSend: function (xhr) {
                setAuthHeader(xhr, config, getCurrentUser(config, user));
            }
        }).done((msg) => {
            const reponseObj = JSON.parse(msg);
            if(reponseObj.status === "200"){
                this.tryDepFlowSearch(reponseObj.result);
            }
        }).always(() => {
            this.props.setControlVisibility("Loading", false);
        });
    };
    shouldComponentUpdate(nextProps,nextState) {
        if( nextProps.flow !== this.props.flow) {
            return false;
        }
        return true;
    }


//-- event list
    close= () =>{
        this.props.close({
            flow : {
                show : false,
                parameter : {}
            }
        });
    };

//- render
    render() {
        const {data} = this.state;
        return(
            <div className="xlog-flow">
                <div className="title">
                </div>
                <div className="close-btn" onClick={this.close}></div>
                <div className="flow-content">
                    <XlogFlowChart width="100%" height="100%">
                        <XlogFlowRender data={data} />
                    </XlogFlowChart>
                </div>
            </div>
        );
     }
}

const mapStateToProps = (state) => {
    return {
        config: state.config,
        user: state.user,
        objects: state.target.objects
    };
};
let mapDispatchToProps = (dispatch) => {
    return {
        addRequest: () => dispatch(addRequest()),
        setControlVisibility: (name, value) => dispatch(setControlVisibility(name, value)),
    };
};

XlogFlow = connect(mapStateToProps, mapDispatchToProps)(XlogFlow);
export default withRouter(XlogFlow);