import React from 'react';
import EthereumAddress from './EthereumAddress';

const Matches = (props) => {
  return (
    <div className="row">
      <div className="col-md-12">
        <h2>All Matches ({Object.keys(props.matches).length})</h2>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th></th>
                <th>Week</th>
                <th>Year</th>
                <th>Local</th>
                <th>Visitor</th>
                <th>Time to bet</th>
                <th>Local Bets Amount</th>
                <th>Visitor Bets Amount</th>
                <th>Tie Bets Amount</th>
              </tr>
            </thead>
            <tbody>
              {
                Object.keys(props.matches).map(key =>
                  <tr key={key} onClick={(e) => props.setUrl(key)}>
                    <td>
                      {props.matches[key]['week']}
                    </td>
                    <td>
                      {props.matches[key]['year']}
                    </td>
                    <td>
                      {props.matches[key]['local']}
                    </td>
                    <td>
                      {props.matches[key]['visitor']}
                    </td>
                    <td>
                      {props.matches[key]['time']}
                    </td>
                    <td>
                      {props.matches[key]['localBetsAmount']}
                    </td>
                    <td>
                      {props.matches[key]['visitorBetsAmount']}
                    </td>
                    <td>
                      {props.matches[key]['tieBetsAmount']}
                    </td>
                    <td>
                      <a href={`#${key}`} onClick={(e) => props.setUrl(key)}>
                        Go to Match
                      </a>
                    </td>
                  </tr>
                )
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Matches;
