const nock = require('nock');
import { HttpClient } from '../lib/index';

// describe('receives a successful http response', () => {
//     beforeAll(async () => {
//         nock('http://testurl.com')
//         .get('/x')
//         .reply(200, {data:1}, {'x-response-time': 500, 'content-length': 500})
//     })

//     it('receives a 200 response', async () => {
//         const client = new HttpClient({name: 'test'});
//         const response = await client.get('http://testurl.com/x', 'requestId')
//         expect(response.data).toEqual(1);
//     })
// });


// describe('receives a not found failed http response', () => {
//     it('receives a 404 response', async () => {
//         nock('http://testurl.com')
//         .get('/x')
//         .reply(404, undefined, {'x-response-time': 500, 'content-length': 500})
//         const client = new HttpClient({name: 'test'});
//         const response = await client.get('http://testurl.com/x', 'requestId')
//         expect(response).toEqual({name:'ESTATUS404', message:'Status code 404 received for http://testurl.com/x', details:'Request failed with status code 404'});
//     })

//     it('receives a 300 response', async () => {
//         nock('http://testurl.com')
//         .get('/x')
//         .reply(300, undefined, {'x-response-time': 500, 'content-length': 500})
//         const client = new HttpClient({name: 'test'});
//         const response = await client.get('http://testurl.com/x', 'requestId')
//         expect(response).toEqual({name:'ESTATUS300', message:'Status code 300 received for http://testurl.com/x', details:'Request failed with status code 300'});
//     })

// });

// describe('receives a successful response ', () => {
//     beforeAll(async () => {
//         nock('http://testurl.com')
//         .get('/x')
//         .reply(200, "");
//     })

//     it('with data that is not an object', async () => {
//         const client = new HttpClient({name: 'test'});
//         const response = await client.get('http://testurl.com/x', 'requestId')   
//         expect(response).toEqual({name:'EUNKNOWN', message:'Response data was not an object' })
//     })
// });

// describe('receives a successful response ', () => {
//     beforeAll(async () => {
//         nock('http://testurl.com')
//         .get('/x')
//         .reply(200, undefined);
//     })
    
//     it('with missing response data', async () => {
//         const client = new HttpClient({name: 'test'});
//         const response = await client.get('http://testurl.com/x', 'requestId')
//         expect(response).toEqual({name:'EUNKNOWN', message:'Response data was not an object' })
//     })
// });



describe('circuit breakers ', () => { 
    const config = {
        "name": "test", 
        "circuitBreaker" : {
        "errorThresholdPercentage": 0,
        "resetTimeout": 1000
        }
    }

    beforeAll(async () => {
        nock('http://testurl.com')
        .persist()
        .get('/x')
        .reply(500, undefined);
    })

    it('should fire the open circuit breaker', async () => {
        const client = new HttpClient(config);
        await client.get('http://testurl.com/x', 'requestId')
        const response = await client.get('http://testurl.com/x', 'requestId')
        expect(response).toEqual({name: `ECIRCUITBREAKER`, message: `Circuit breaker is open for test`})
    })

    it('should close the circuit breaker', async () => {
        const client = new HttpClient(config);
        await client.get('http://testurl.com/x', 'requestId')
        await client.get('http://testurl.com/x', 'requestId')
        
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                const response = await client.get('http://testurl.com/x', 'requestId')
                resolve(expect(response).toEqual({name: `ESTATUS500`, message: `Status code 500 received for http://testurl.com/x`, details: "Request failed with status code 500"}))
            }, 2000)
        })
    })

    afterAll(()=> {
        nock.cleanAll()
    })
})

describe('Timeouts ', () => { 
    beforeAll(async () => {
        nock('http://testurl.com')
        .get('/x')
        .delayConnection(2500)
        .reply(200, {data:1}, {'x-response-time': 2000, 'content-length': 500})
    })

    it('should return a timeout error', async () => {
        const client = new HttpClient({name: 'test'});
        const response = await client.get('http://testurl.com/x', 'requestId')
        expect(response).toEqual({name: `ECONNABORTED`, message: `timeout of ${client.client.defaults.timeout}ms exceeded`})
    })

})

