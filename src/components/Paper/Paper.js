import React, {Component} from 'react';
import './Paper.css';
import './Resizable.css';
import {connect} from 'react-redux';
import {addRequest} from '../../actions';
import {withRouter} from 'react-router-dom';
import {Responsive, WidthProvider} from "react-grid-layout";
import {Box, BoxConfig, PaperControl} from "../../components";
import jQuery from "jquery";
import {getData, setData, getHttpProtocol} from '../../common/common';
const ResponsiveReactGridLayout = WidthProvider(Responsive);

class Paper extends Component {
    dataRefreshTimer = null;
    tickInterval = 1000;
    tickTimer = null;
    constructor(props) {
        super(props);
        let layouts = getData("layouts");
        let boxes = getData("boxes");

        if (!(layouts)) {
            layouts = {};
        }

        if (!boxes) {
            boxes = [];
        }

        let range = 1000 * 60 * 10;
        let endTime = (new Date()).getTime();
        let startTime = endTime - range;

        this.state = {
            layouts: layouts,
            boxes: boxes,

            data : {
                tempXlogs: [],
                firstStepXlogs: [],
                firstStepTimestamp: null,
                secondStepXlogs: [],
                secondStepTimestamp: null,
                xlogs: [],
                newXLogs: [],
                offset1: 0,
                offset2: 0,
                startTime: startTime,
                endTime: endTime,
                range: range,
                maxElapsed: 2000,
                lastRequestTime : null
            }
        };
    }

    componentDidMount() {
        this.dataRefreshTimer = setInterval(() => {
            this.getXLog();
        }, this.props.config.interval);

        /*this.tickTimer = setInterval(() => {
            this.tick();
        }, this.tickInterval);*/
    }

    componentWillUnmount() {
        clearInterval(this.dataRefreshTimer);
        this.dataRefreshTimer = null;

        clearInterval(this.tickTimer);
        this.tickTimer = null;
    }

    getXLog = () => {
        if (this.props.instances && this.props.instances.length > 0) {
            this.props.addRequest();
            jQuery.ajax({
                method: "GET",
                async: true,
                url: getHttpProtocol(this.props.config) + '/scouter/v1/xlog/realTime/' + this.state.data.offset1 + '/' + this.state.data.offset2 + '?objHashes=' + JSON.stringify(this.props.instances.map((instance) => {
                    return Number(instance.objHash);
                }))
            }).done((msg) => {


                this.tick(msg.result);

            }).fail((jqXHR, textStatus) => {
                console.log(jqXHR, textStatus);
            });
        }
    };

    tick = (result) => {

        let now = (new Date()).getTime();

        let datas = result.xlogs.map((d) => {
            d["_custom"] = {
                p: false
            };
            return d;
        });

        let tempXlogs = this.state.data.tempXlogs.concat(datas);

        let data = this.state.data;
        data.offset1 = result.offset1;
        data.offset2 = result.offset2;
        data.tempXlogs = tempXlogs;
        data.lastRequestTime = now;


        let endTime = (new Date()).getTime();
        let startTime = endTime - this.state.data.range;

        let firstStepStartTime = this.state.data.lastRequestTime - 1000;
        let secondStepStartTime = firstStepStartTime - 5000;

        let xlogs = this.state.data.xlogs;
        let newXLogs = this.state.data.newXLogs;
        let firstStepXlogs = this.state.data.firstStepXlogs;
        let secondStepXlogs = this.state.data.secondStepXlogs;
        let lastStepXlogs = [];

        for (let i = 0; i < secondStepXlogs.length; i++) {
            let d = secondStepXlogs[i];
            if (d.endTime >= firstStepStartTime) {
                firstStepXlogs.push(secondStepXlogs.splice(i, 1)[0]);
            } else if (d.endTime >= secondStepStartTime && d.endTime < firstStepStartTime) {

            } else {
                lastStepXlogs.push(secondStepXlogs.splice(i, 1)[0]);
            }
        }


        for (let i = 0; i < firstStepXlogs.length; i++) {
            let d = firstStepXlogs[i];
            if (d.endTime >= firstStepStartTime) {

            } else if (d.endTime >= secondStepStartTime && d.endTime < firstStepStartTime) {
                secondStepXlogs.push(firstStepXlogs.splice(i, 1)[0]);
            } else {
                lastStepXlogs.push(firstStepXlogs.splice(i, 1)[0]);
            }
        }

        for (let i = 0; i < tempXlogs.length; i++) {
            let d = tempXlogs[i];
            if (d.endTime >= firstStepStartTime) {
                firstStepXlogs.push(d);
            } else if (d.endTime >= secondStepStartTime && d.endTime < firstStepStartTime) {
                secondStepXlogs.push(d);
            } else {
                lastStepXlogs.push(d);
            }
        }

        xlogs = xlogs.concat(newXLogs);
        newXLogs = lastStepXlogs;


        let outOfRangeIndex = -1;
        for (let i = 0; i < xlogs.length; i++) {
            let d = xlogs[i];
            if (startTime < d.endTime) {
                break;
            }
            outOfRangeIndex = i;
        }

        if (outOfRangeIndex > -1) {
            xlogs.splice(0, outOfRangeIndex + 1);
        }



        data.tempXlogs = [];
        data.firstStepXlogs = firstStepXlogs;
        data.firstStepTimestamp = now;
        data.secondStepXlogs = secondStepXlogs;
        data.secondStepTimestamp = now;
        data.xlogs = xlogs;
        data.newXLogs = newXLogs;
        data.startTime = startTime;
        data.endTime = endTime;

        this.setState({
            data : data
        });
    };

    onLayoutChange(layout, layouts) {
        let boxes = this.state.boxes;
        boxes.forEach((box) => {
            layout.forEach((l) => {
                if (box.key === l.i) {
                    box.layout = l;
                    return false;
                }
            });
        });
        setData("layouts", layouts);
        setData("boxes", this.state.boxes);
        this.setState({
            layouts : layouts
        });
    }

    getUniqueKey() {
        let dup = false;
        let key = null;
        do {
            key = String(this.state.boxes.length + 1);
            this.state.boxes.forEach((box) => {
                if (box.key === key) {
                    dup = true;
                    return false;
                }
            });
        } while (dup);

        return key;
    }

    addPaper = () => {
        let boxes = this.state.boxes;
        let key = this.getUniqueKey();
        boxes.push({
            key: key,
            title: "NO TITLE ",
            layout: {w: 6, h: 4, x: 0, y: 0, minW: 1, minH: 3, i: key},
        });

        this.setState({
            boxes: boxes
        });

        setData("boxes", boxes);
    };

    removePaper = (key) => {
        let boxes = this.state.boxes;
        boxes.forEach((box, i) => {
            if (box.key === key) {
                boxes.splice(i, 1);
                return false;
            }
        });

        let layouts = this.state.layouts;


        for (let unit in layouts) {
            if (layouts[unit] && layouts[unit].length > 0) {
                layouts[unit].forEach((layout, i) => {
                    if (layout.i === key) {
                        layouts[unit].splice(i, 1);
                        return false;
                    }
                })
            }
        }

        this.setState({
            boxes: boxes,
            layouts: layouts
        });
    };

    clearLayout = () => {
        this.setState({
            boxes: [],
            layouts: {}
        });
    };

    setOption = (key, option) => {
        let boxes = this.state.boxes;
        boxes.forEach((box) => {
            if (box.key === key) {

                if (option.mode === "exclusive") {
                    box.option = {
                        mode: option.mode,
                        type: option.type,
                        config: option.config,
                    };
                } else {
                    box.option.push({
                        mode: option.mode,
                        type: option.type,
                        config: option.config,
                    });
                }

                box.values = {};
                for (let attr in option.config) {
                    box.values[attr] = option.config[attr].value;
                }

                box.config = false;
                box.title = option.title;
                return false;
            }
        });

        this.setState({
            boxes: boxes
        });

        setData("boxes", boxes);
    };

    setOptionValues = (key, values) => {

        let boxes = this.state.boxes;
        boxes.forEach((box) => {
            if (box.key === key) {
                for (let attr in values) {
                    box.values[attr] = values[attr];
                }

                box.config = false;
            }
        });

        this.setState({
            boxes: boxes
        });

        setData("boxes", boxes);
    };

    setOptionClose= (key) => {


        let boxes = this.state.boxes;
        boxes.forEach((box) => {
            if (box.key === key) {
                box.config = false;
            }
        });

        this.setState({
            boxes: boxes
        });

        setData("boxes", boxes);
    };


    toggleConfig = (key) => {
        let boxes = this.state.boxes;
        boxes.forEach((box) => {
            if (box.key === key) {
                box.config = !box.config;
                return false;
            }
        });

        this.setState({
            boxes: boxes
        });

    };



    render() {

        return (
            <div className="papers">
                <PaperControl addPaper={this.addPaper} clearLayout={this.clearLayout} />
                <ResponsiveReactGridLayout className="layout" cols={{lg: 12, md: 10, sm: 6, xs: 4, xxs: 2}} layouts={this.state.layouts} rowHeight={30} onLayoutChange={(layout, layouts) => this.onLayoutChange(layout, layouts)}>
                    {this.state.boxes.map((box, i) => {
                        return <div className="box-layout" key={box.key} data-grid={box.layout}>
                            <button className="box-control box-layout-remove-btn last" onClick={this.removePaper.bind(null, box.key)}><i className="fa fa-times-circle-o" aria-hidden="true"></i></button>
                            {box.option && box.option.config && <button className="box-control box-layout-config-btn" onClick={this.toggleConfig.bind(null, box.key)}><i className="fa fa-cog" aria-hidden="true"></i></button>}
                            {box.config && <BoxConfig box={box} setOptionValues={this.setOptionValues} setOptionClose={this.setOptionClose} />}
                            <Box setOption={this.setOption} box={box} data={this.state.data} config={this.props.config}/>
                        </div>
                    })}
                </ResponsiveReactGridLayout>
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

Paper = connect(mapStateToProps, mapDispatchToProps)(Paper);
export default withRouter(Paper);