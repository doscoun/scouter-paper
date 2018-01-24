import React, {Component} from 'react';
import './Settings.css';
import {connect} from 'react-redux';
import {setConfig} from '../../actions';
import {CompactPicker} from 'react-color';

const colors = ['transparent', '#999999', '#FFFFFF', '#F44E3B', '#FE9200', '#FCDC00', '#DBDF00', '#A4DD00', '#68CCCA', '#73D8FF', '#AEA1FF', '#FDA1FF', '#333333', '#808080', '#cccccc', '#D33115', '#E27300', '#FCC400', '#B0BC00', '#68BC00', '#16A5A5', '#009CE0', '#7B64FF', '#FA28FF', '#000000', '#666666', '#B3B3B3', '#9F0500', '#C45100', '#FB9E00', '#808900', '#194D33', '#0C797D', '#0062B1', '#653294', '#AB149E'];
class Settings extends Component {

    constructor(props) {
        super(props);

        this.state = {
            config: {
                protocol: "http",
                address: "127.0.0.1",
                port: 6188,
                interval: 1000,
                numberFormat: "999,999.00",
                dateFormat: "YYYY-MM-DD",
                timeFormat: "HH:MM:SS",
                minuteFormat: "HH:MM",
                xlog: {
                    normal: {
                        rows: 5,
                        columns: 5,
                        fills: {
                            D_0_2: {
                                color: "#0062B1"
                            },
                            D_1_2: {
                                color: "#0062B1"
                            },
                            D_2_0: {
                                color: "#0062B1"
                            },
                            D_2_1: {
                                color: "#0062B1"
                            },
                            D_2_2: {
                                color: "#0062B1"
                            },
                            D_2_3: {
                                color: "#0062B1"
                            },
                            D_2_4: {
                                color: "#0062B1"
                            },
                            D_3_2: {
                                color: "#0062B1"
                            },
                            D_4_2: {
                                color: "#0062B1"
                            }
                        }
                    },
                    error: {
                        rows: 5,
                        columns: 5,
                        fills: {
                            D_0_2: {
                                color: "#9F0500"
                            },
                            D_1_2: {
                                color: "#9F0500"
                            },
                            D_2_0: {
                                color: "#9F0500"
                            },
                            D_2_1: {
                                color: "#9F0500"
                            },
                            D_2_2: {
                                color: "#9F0500"
                            },
                            D_2_3: {
                                color: "#9F0500"
                            },
                            D_2_4: {
                                color: "#9F0500"
                            },
                            D_3_2: {
                                color: "#9F0500"
                            },
                            D_4_2: {
                                color: "#9F0500"
                            }
                        }
                    }
                }
            },
            selected : {
                normal : {
                    cellId : null,
                    color : "white"
                },
                error : {
                    cellId : null,
                    color : "white"
                }
            },
            edit: false
        };
    }

    onChange = (attr, event) => {
        let config = this.state.config;
        config[attr] = event.target.value;
        this.setState({
            config: config
        });
    };

    onXLogSizeChange = (type, dir, event) => {

        let config = this.state.config;

        config.xlog[type][dir] = event.target.value;
        this.setState({
            config: config
        });

    };

    applyConfig = () => {
        if (localStorage) {
            this.props.setConfig(this.state.config)
            localStorage.setItem("config", JSON.stringify(this.state.config));
            this.setState({
                edit: false,
                selected : {
                    normal : {
                        cellId : null,
                        color : "white"
                    },
                    error : {
                        cellId : null,
                        color : "white"
                    }
                },
            });
        }
    };

    resetConfig = () => {
        if (this.props.config) {
            this.setState({
                config: JSON.parse(JSON.stringify(this.props.config)),
                edit: false,
                selected : {
                    normal : {
                        cellId : null,
                        color : "white"
                    },
                    error : {
                        cellId : null,
                        color : "white"
                    }
                },
            });
        }
    };

    editClick = () => {
        this.setState({
            edit: true,
            selected : {
                normal : {
                    cellId : null,
                    color : "white"
                },
                error : {
                    cellId : null,
                    color : "white"
                }
            },
        });
    };

    componentWillReceiveProps(nextProps) {
        if (nextProps.config) {
            this.setState({
                config: JSON.parse(JSON.stringify(nextProps.config))
            });
        }
    };

    componentDidMount() {
        if (this.props.config) {
            this.setState({
                config: JSON.parse(JSON.stringify(this.props.config))
            });
        }
    }

    getXLogDraw = (type) => {
        let xlogDotSetting = [];
        for (let i = 0; i < this.state.config.xlog[type].rows; i++) {
            xlogDotSetting.push({
                row: i,
                columns: []
            });

            for (let j = 0; j < this.state.config.xlog[type].columns; j++) {
                xlogDotSetting[i].columns.push({
                    column: j
                })
            }
        }

        return xlogDotSetting;
    };

    selectXLogCell = (type, cellId) => {

        if (!this.state.edit) {
            return;
        }
        let selected = this.state.selected;
        if (selected[type].cellId  === cellId) {
            selected[type].cellId = null;
        } else {
            selected[type].cellId = cellId;
            if (this.state.config.xlog[type].fills[cellId]) {
                selected[type].color = this.state.config.xlog[type].fills[cellId].color;
            } else {
                selected[type].color = "transparent";
            }

        }

        this.setState({
            selected : selected
        });

    };

    normalColorChange = (color, event) => {

        if (!this.state.edit) {
            return;
        }

        let cellId = this.state.selected.normal.cellId;
        let selected = this.state.selected;
        if (cellId) {
            let config = this.state.config;
            if (config.xlog.normal.fills[cellId]) {
                if (color.hex === "transparent") {
                    delete config.xlog.normal.fills[cellId];
                } else {
                    config.xlog.normal.fills[cellId].color = color.hex;
                }
            } else {
                config.xlog.normal.fills[cellId] = {};
                config.xlog.normal.fills[cellId].color = color.hex;
            }

            selected.normal.color = color.hex;

            console.log(selected);
            this.setState({
                config : config,
                selected : selected
            });
        }
    };

    errorColorChange = (color, event) => {

        if (!this.state.edit) {
            return;
        }

        let cellId = this.state.selected.error.cellId;
        let selected = this.state.selected;

        if (cellId) {
            let config = this.state.config;
            if (config.xlog.error.fills[cellId]) {


                config.xlog.error.fills[cellId].color = color.hex;
            } else {
                config.xlog.error.fills[cellId] = {};
                config.xlog.error.fills[cellId].color = color.hex;
            }

            selected.error.color = color.hex;

            this.setState({
                config : config,
                selected : selected
            });
        }
    };

    render() {

        let normalDotSetting = this.getXLogDraw("normal");
        let errorDotSetting = this.getXLogDraw("error");

        return (
            <div className={"settings " + (this.state.edit ? 'editable' : '')}>
                <div className="forms">
                    <div className="category first">
                        <div>SCOUTER SERVER INFO</div>
                    </div>
                    <div className="setting-box">
                        <div className="row">
                            <div className="label">
                                <div>PROTOCOL</div>
                            </div>
                            <div className="input">
                                <input type="text" readOnly={!this.state.edit}
                                       onChange={this.onChange.bind(this, "protocol")} value={this.state.config.protocol}/>
                            </div>
                        </div>
                        <div className="row">
                            <div className="label">
                                <div>ADDRESS</div>
                            </div>
                            <div className="input">
                                <input type="text" readOnly={!this.state.edit}
                                       onChange={this.onChange.bind(this, "address")} value={this.state.config.address}/>
                            </div>
                        </div>
                        <div className="row">
                            <div className="label">
                                <div>POST</div>
                            </div>
                            <div className="input">
                                <input type="text" readOnly={!this.state.edit} onChange={this.onChange.bind(this, "port")}
                                       value={this.state.config.port}/>
                            </div>
                        </div>
                        <div className="row">
                            <div className="label">
                                <div>INTERVAL</div>
                            </div>
                            <div className="input">
                                <input type="text" readOnly={!this.state.edit}
                                       onChange={this.onChange.bind(this, "interval")} value={this.state.config.interval}/>
                            </div>
                        </div>
                    </div>
                    <div className="category">
                        <div>DATA FORMAT CONFIGURATION</div>
                    </div>
                    <div className="setting-box">
                        <div className="row">
                            <div className="label">
                                <div>NUMBER FORMAT</div>
                            </div>
                            <div className="input">
                                <input type="text" readOnly={!this.state.edit}
                                       onChange={this.onChange.bind(this, "numberFormat")}
                                       value={this.state.config.numberFormat}/>
                            </div>
                        </div>
                        <div className="row">
                            <div className="label">
                                <div>DATE FORMAT</div>
                            </div>
                            <div className="input">
                                <input type="text" readOnly={!this.state.edit}
                                       onChange={this.onChange.bind(this, "dateFormat")}
                                       value={this.state.config.dateFormat}/>
                            </div>
                        </div>
                        <div className="row ">
                            <div className="label">
                                <div>TIME FORMAT</div>
                            </div>
                            <div className="input">
                                <input type="text" readOnly={!this.state.edit}
                                       onChange={this.onChange.bind(this, "timeFormat")}
                                       value={this.state.config.timeFormat}/>
                            </div>
                        </div>
                        <div className="row last">
                            <div className="label">
                                <div>MINUTES FORMAT</div>
                            </div>
                            <div className="input">
                                <input type="text" readOnly={!this.state.edit}
                                       onChange={this.onChange.bind(this, "minuteFormat")}
                                       value={this.state.config.minuteFormat}/>
                            </div>
                        </div>
                    </div>
                    <div className="category">
                        <div>XLOG CONFIGURATION</div>
                    </div>
                    <div className="setting-box">
                        <div className="row ">
                            <div className="label">
                                <div>DOT SIZE (NORMAL)</div>
                            </div>
                            <div className="input xlog-size">
                                <div className="xlog-label">ROWS</div>
                                <select value={this.state.config.xlog.normal.rows} onChange={this.onXLogSizeChange.bind(this, "normal", "rows")} disabled={!this.state.edit}>
                                    <option>3</option><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option>
                                </select>
                                <div className="xlog-label second">COLUMNS</div>
                                <select value={this.state.config.xlog.normal.columns} onChange={this.onXLogSizeChange.bind(this, "normal", "columns")} disabled={!this.state.edit}>
                                    <option>3</option><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option>
                                </select>
                            </div>
                        </div>
                        <div className="row ">
                            <div className="label">
                                <div>DOT SIZE (ERROR)</div>
                            </div>
                            <div className="input xlog-size">
                                <div className="xlog-label">ROWS</div>
                                <select value={this.state.config.xlog.error.rows} onChange={this.onXLogSizeChange.bind(this, "error", "rows")} disabled={!this.state.edit}>
                                    <option>3</option><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option>
                                </select>
                                <div className="xlog-label second">COLUMNS</div>
                                <select value={this.state.config.xlog.error.columns} onChange={this.onXLogSizeChange.bind(this, "error", "columns")} disabled={!this.state.edit}>
                                    <option>3</option><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option>
                                </select>
                            </div>
                        </div>
                        <div className="row">
                            <div className="label">
                                <div>XLOG DOT (NORMAL)</div>
                            </div>
                            <div className="input">
                                <div className="xlog-dot-config">
                                    <div className="xlog-dot-config-left" style={{width : ((this.state.config.xlog.normal.columns * 20) + 20) + "px"}}>
                                        <div className="xlog-normal-dot">
                                            {normalDotSetting.map((d, i) => {
                                                return <div key={i} className={"xlog-dot-rows " + ((normalDotSetting.length - 1) === i ? 'last' : '')}>
                                                    {d.columns.map((c, j) => {
                                                        let cellId = "D_" + i + "_" + j;
                                                        let fill = this.state.config.xlog.normal.fills[cellId];
                                                        let color = "transparent";
                                                        if (fill) {
                                                            color = fill.color;
                                                        }
                                                        let selected = (this.state.selected["normal"].cellId === cellId);
                                                        return <div key={j} onClick={this.selectXLogCell.bind(null, "normal", cellId)} className={"xlog-dot-columns " + (selected ? 'selected ' : ' ') + (((d.columns.length - 1) === j) ? 'last ' : ' ')} style={{backgroundColor: color}}></div>
                                                    })}
                                                </div>
                                            })}
                                        </div>
                                    </div>
                                    <div className="xlog-config-controller">
                                        <CompactPicker colors={colors} color={ this.state.selected.normal.color } onChange={this.normalColorChange}/>
                                        <div className="disabled-wrapper"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="label">
                                <div>XLOG DOT (ERROR)</div>
                            </div>
                            <div className="input">
                                <div className="xlog-dot-config">
                                    <div className="xlog-dot-config-left" style={{width : ((this.state.config.xlog.error.columns * 20) + 20) + "px"}}>
                                        <div className="xlog-normal-dot">
                                            {errorDotSetting.map((d, i) => {
                                                return <div key={i} className={"xlog-dot-rows " + ((errorDotSetting.length - 1) === i ? 'last' : '')}>
                                                    {d.columns.map((c, j) => {
                                                        let cellId = "D_" + i + "_" + j;
                                                        let fill = this.state.config.xlog.error.fills[cellId];
                                                        let color = "transparent";
                                                        if (fill) {
                                                            color = fill.color;
                                                        }
                                                        let selected = (this.state.selected["error"].cellId === cellId);
                                                        return <div key={j} onClick={this.selectXLogCell.bind(null, "error", cellId)} className={"xlog-dot-columns " + (selected ? 'selected ' : ' ') + (((d.columns.length - 1) === j) ? 'last ' : ' ')} style={{backgroundColor: color}}></div>
                                                    })}
                                                </div>
                                            })}
                                        </div>
                                    </div>
                                    <div className="xlog-config-controller">
                                        <CompactPicker colors={colors} color={ this.state.selected.error.color } onChange={this.errorColorChange}/>
                                        <div className="disabled-wrapper"></div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
                {this.state.edit &&
                <div className="buttons">
                    <button onClick={this.resetConfig}>CANCEL</button>
                    <button onClick={this.applyConfig}>APPLY</button>
                </div>
                }
                {!this.state.edit &&
                <div className="buttons">
                    <button onClick={this.editClick}>EDIT</button>
                </div>
                }
            </div>
        );
    }
}

let mapStateToProps = (state) => {
    return {
        instances: state.target.instances,
        config: state.config
    };
};

let mapDispatchToProps = (dispatch) => {
    return {
        setConfig: (config) => dispatch(setConfig(config))
    };
};

Settings = connect(mapStateToProps, mapDispatchToProps)(Settings);

export default Settings;