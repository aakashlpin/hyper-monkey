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
  AppState,
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
    this._handleAppStateChange = this._handleAppStateChange.bind(this)
  }

  componentDidMount () {
    this.getSchedule();
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  componentWillUnmount () {
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  _handleAppStateChange (currentAppState) {
    if (currentAppState === 'active') {
      this.getSchedule();
    }
  }

  getMinutesSinceMidnight (timeString) {
    const meridian = timeString.split(' ')[1];
    const clock = timeString.split(' ')[0].split(':');
    const hour = Number(clock[0]);
    const minute = Number(clock[1]);
    return (((hour + (meridian === 'PM' ? 12 : 0)) * 60) + minute);
  }

  getSchedule () {
    this.setState({
      ...this.state,
      isFetching: true
    });

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

        o[this.getMinutesSinceMidnight(time)] = {
          time, schedule: timeColumns
        };

        return o;

      }, {});

      this.setState({
        isFetching: false,
        timeGrid
      });
    });
  }

  _nextWeekday (current) {
    if (current === 6) {
      return 0;
    }
    return current + 1;
  }

  renderScheduleItem ({minutes, weekday}) {
    const { timeGrid } = this.state;
    return <Text key={minutes}>{`${timeGrid[minutes].time} : ${timeGrid[minutes].schedule[weekday]}`}</Text>;
  }

  renderSchedule () {
    const { timeGrid } = this.state;
    const weekday = moment().isoWeekday() - 1;
    const atMinuteSinceMidnight = Object.keys(timeGrid).map(num => Number(num));

    const now = moment();
    const target = now.hours() * 60 + now.minutes();

    let nextClass = 'No more classes scheduled for the day.';
    const nextClassAt = atMinuteSinceMidnight.find(minute => target - minute < 0 && timeGrid[minute].schedule[weekday]);
    if (nextClassAt) {
      const nextClassSchedule = timeGrid[nextClassAt];
      const nextClassToday = nextClassSchedule.schedule[weekday];

      nextClass = nextClassToday
        ? `${nextClassSchedule.time} : ${nextClassToday}`
        : nextClass
    }

    const upcomingClasses = atMinuteSinceMidnight
      .filter(minutes => minutes !== nextClassAt && target - minutes < 0 && timeGrid[minutes].schedule[weekday])
      .map(minutes => {
        return this.renderScheduleItem({minutes, weekday});
      });

    const nextWeekday = this._nextWeekday(weekday);

    const classesTomorrow = atMinuteSinceMidnight
      .filter(minutes => timeGrid[minutes].schedule[nextWeekday])
      .map(minutes => {
        return this.renderScheduleItem({minutes, weekday: nextWeekday});
      });

    return (
      <View>
        <View style={styles.classesBlock}>
          <Text style={styles.heading}>Next Class Today</Text>
          <Text>{nextClass}</Text>
        </View>
        {
          upcomingClasses.length ? (
            <View style={styles.classesBlock}>
              <Text style={styles.heading}>Upcoming Classes Today</Text>
              {upcomingClasses}
            </View>
          ) : null
        }
        <View style={styles.classesBlock}>
          <Text style={styles.heading}>Tomorrow</Text>
          {classesTomorrow}
        </View>
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
  heading: {
    fontWeight: 'bold',
    fontSize: 16
  },
  classesBlock: {
    marginBottom: 10
  }
});

AppRegistry.registerComponent('hyperMonkey', () => hyperMonkey);
