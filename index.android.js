/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */

import React, {
  AppRegistry,
  Component,
  StyleSheet,
  Text,
  View,
  ProgressBarAndroid
} from 'react-native';

import moment from 'moment';
import cheerio from 'cheerio';

class hyperMonkey extends Component {
  constructor () {
    super();
    this.state = {
      isFetching: true
    };
  }

  componentWillMount () {
    this.getSchedule();
  }

  getMinutesSinceMidnight (timeString) {
    const meridian = timeString.split(' ')[1];
    const clock = timeString.split(' ')[0].split(':');
    const hour = Number(clock[0]);
    const minute = Number(clock[1]);
    return (((hour + (meridian === 'PM' ? 12 : 0)) * 60) + minute);
  }

  getSchedule () {
    return fetch('http://www.hypermonkey.in/index.php?page=schedule')
    .then(r => r.text())
    .then(r => {
      const $ = cheerio.load(r);
      const $timeSlots = $('#schedule_table tr');
      const timeGrid = $timeSlots.toArray().reduce((o, t) => {
        const $timeCells = $(t).find('> td');
        const time = $timeCells.find('.time div').html();
        const timeColumns = $timeCells.not('.time').toArray().reduce((slots, cell, weekday) => {
          const $cell = $(cell);
          const cellValue = $cell.find('div b').html();
          if (cellValue) {
            slots[weekday] = cellValue;
          }
          return slots;
        }, {});

        if (!Object.keys(timeColumns).length) {
          return o;
        }

        o[this.getMinutesSinceMidnight(time)] = timeColumns;
        return o;

      }, {});

      this.setState({
        isFetching: false,
        timeGrid
      });
    });
  }

  renderSchedule () {
    const weekday = moment().format('E') - 1;
    const atMinuteSinceMidnight = Object.keys(this.state.timeGrid);

    const now = moment.utc();
    const target = now.hours() * 60 + now.minutes();

    const nextClassAt = atMinuteSinceMidnight.sort().find(minute => target - minute < 0);

    const nextClass = this.state.timeGrid[nextClassAt][weekday] || 'No Classes scheduled in the day now';

    return (
      <View>
        <Text>{nextClass}</Text>
      </View>
    )
  }

  render() {
    return (
      <View style={styles.container}>
        {
          this.state.isFetching ? (
            <ProgressBarAndroid />
          ) : this.renderSchedule()
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('hyperMonkey', () => hyperMonkey);
