import React, {Component} from 'react';
import './Profiler.css';
import {addRequest} from '../../../../actions';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import jQuery from "jquery";
import {getDate, getHttpProtocol} from '../../../../common/common';
import SingleProfile from "./SingleProfile/SingleProfile";
import ProfileList from "./ProfileList/ProfileList";

class Profiler extends Component {


    constructor(props) {
        super(props);
        this.state = {
            show: false,
            xlogs: [],
            last: null,
            txid : null,
            enter : false,
            profile : null,
            steps : null,
            summary : true,
            bind : false,
            wrap : true,
            gap : true
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (JSON.stringify(nextProps.selection) !== JSON.stringify(this.props.selection)) {
            return true;
        }

        if (nextState.last !== this.state.last) {
            return true;
        }

        if (nextState.show !== this.state.show) {
            return true;
        }

        if (nextState.txid !== this.state.txid) {
            return true;
        }

        if (nextState.enter !== this.state.enter) {
            return true;
        }

        if (JSON.stringify(nextState.profile) !== JSON.stringify(this.state.profile)) {
            return true;
        }

        if (JSON.stringify(nextState.steps) !== JSON.stringify(this.state.steps)) {
            return true;
        }

        if (nextState.summary !== this.state.summary) {
            return true;
        }

        if (nextState.bind !== this.state.bind) {
            return true;
        }

        if (nextState.wrap !== this.state.wrap) {
            return true;
        }

        if (nextState.gap !== this.state.gap) {
            return true;
        }

        return false;
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.selection.x1 === null || nextProps.selection.x2 === null || nextProps.selection.y1 === null || nextProps.selection.y2 === null) {
            this.setState({
                show: false
            });
        } else {

            if (JSON.stringify(nextProps.selection) !== JSON.stringify(this.props.selection)) {
                let x1 = nextProps.selection.x1;
                let x2 = nextProps.selection.x2;
                let y1 = nextProps.selection.y1;
                let y2 = nextProps.selection.y2;
                this.getList(x1, x2, y1, y2);
            }
        }
    }



    getList = (x1, x2, y1, y2) => {

        let date = getDate(new Date(x1), 1);

        this.props.addRequest();
        jQuery.ajax({
            method: "GET",
            async: true,
            url: getHttpProtocol(this.props.config) + '/scouter/v1/xlog-data/search/' + date + '?objHashes=' + this.props.instances[0].objHash + "&startTimeMillis=" + x1 + "&endTimeMillis=" + x2
        }).done((msg) => {

            let list = msg.result;

            if (list && list.length > 0) {

                let instanceMap = {};
                for (let i=0; i<this.props.instances.length; i++) {
                    instanceMap[this.props.instances[i].objHash] = this.props.instances[i].objName;
                }

                let xlogs = [];
                for (let i = 0; i < list.length; i++) {
                    let xlog = list[i];
                    let elapsed = Number(xlog.elapsed);
                    if (y1 <= elapsed && y2 >= elapsed) {
                        xlog.objName = instanceMap[xlog.objHash];
                        xlogs.push(xlog);
                    }
                }

                this.setState({
                    show: true,
                    xlogs: xlogs,
                    last: (new Date()).getTime()
                });
            }

        }).fail((jqXHR, textStatus) => {
            console.log(jqXHR, textStatus);
        });
    };

    close = () => {
        console.log(1);
        this.setState({
            show: false,
            xlogs: [],
            last: null,
            txid : null,
            enter : false,
            profile : null,
            steps : null
        });
    };


    rowClick = (xlog) => {
        if (this.state.txid === xlog.txid) {
            this.setState({
                txid: null
            });
        } else {
            this.setState({
                txid: xlog.txid,
                enter: false
            });
        }


        // XLOG DATA
        this.props.addRequest();
        jQuery.ajax({
            method: "GET",
            async: true,
            url: getHttpProtocol(this.props.config) + '/scouter/v1/xlog-data/' + getDate(new Date(Number(xlog.endTime)), 1) + "/" + xlog.txid
        }).done((msg) => {
            this.setState({
                profile : msg.result
            });
        }).fail((jqXHR, textStatus) => {
            console.log(jqXHR, textStatus);
        });

        // XLOG DATA
        this.props.addRequest();
        jQuery.ajax({
            method: "GET",
            async: true,
            url: getHttpProtocol(this.props.config) + '/scouter/v1/profile-data/' + getDate(new Date(Number(xlog.endTime)), 1) + "/" + xlog.txid
        }).done((msg) => {
            this.setState({
                steps : msg.result
            });

        }).fail((jqXHR, textStatus) => {
            console.log(jqXHR, textStatus);
        });


    };

    mouseListEnter = () => {
        this.setState({
            enter: true
        });
    };

    mouseListLeave = () => {
        this.setState({
            enter: false
        });
    };

    toggleSummary = () => {
        this.setState({
            summary : !this.state.summary
        });
    };

    toggleBind = () => {
        this.setState({
            bind : !this.state.bind
        });
    };


    toggleWrap = () => {
        this.setState({
            wrap : !this.state.wrap
        });
    };

    toggleGap = () => {
        this.setState({
            gap : !this.state.gap
        });
    };




    render() {
        let selectRow = (this.state.txid ? true : false);
        if (this.state.enter) {
            selectRow = false;
        }

        return (
            <div className={"xlog-profiler " + (this.state.show ? ' ' : 'hidden ' ) + (selectRow ? 'select-row' : '')}>
                <div className="profile-list scrollbar" onMouseEnter={this.mouseListEnter} onMouseLeave={this.mouseListLeave}>
                    <ProfileList txid={this.state.txid} xlogs={this.state.xlogs} rowClick={this.rowClick} />
                </div>
                <div className={"profile-steps "+ (selectRow ? 'select-row' : '')}>
                    <div className="profile-steps-control">
                        <div className={"profile-control-btn " + (this.state.summary ? 'active' : '')} onClick={this.toggleSummary}>SUMMARY</div>
                        <div className={"profile-control-btn " + (this.state.bind ? 'active' : '')} onClick={this.toggleBind}>BIND</div>
                        <div className={"profile-control-btn " + (this.state.wrap ? 'active' : '')} onClick={this.toggleWrap}>WRAP</div>
                        <div className={"profile-control-btn " + (this.state.gap ? 'active' : '')} onClick={this.toggleGap}>GAP</div>
                        <div onClick={this.close} className="close-btn"></div>
                    </div>
                    <div className="profile-steps-content scrollbar">
                        <SingleProfile txid={this.state.txid} profile={this.state.profile} steps={this.state.steps} summary={this.state.summary} bind={this.state.bind} wrap={this.state.wrap} gap={this.state.gap} />
                    </div>
                </div>
            </div>
        );
    }
}

let mapStateToProps = (state) => {
    return {
        instances: state.target.instances,
        config: state.config,
        user: state.user
    };
};

let mapDispatchToProps = (dispatch) => {
    return {
        addRequest: () => dispatch(addRequest())
    };
};

Profiler = connect(mapStateToProps, mapDispatchToProps)(Profiler);
export default withRouter(Profiler);