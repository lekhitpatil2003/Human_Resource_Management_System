package hrms.hrms;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.transaction.annotation.Transactional;


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class CityControllerTest {
	
	 @Autowired
	    private MockMvc mockMvc;

	    private String unique(String prefix) {
	        return prefix + System.nanoTime();
	    }

	    @Test
	    void should_get_all_cities() throws Exception {

	        mockMvc.perform(get("/api/cities/getAll"))
	                .andExpect(status().isOk());
	    }

	    @Test
	    void should_create_city() throws Exception {

	        String json = """
	        {
	            "cityName":"Istanbul-Test"
	        }
	        """;

	        mockMvc.perform(post("/api/cities/add")
	                        .contentType(MediaType.APPLICATION_JSON)
	                        .content(json))
	                .andExpect(status().isOk());
	    }

	    @Test
	    void should_fail_when_city_name_is_blank() throws Exception {

	        String json = """
	        {
	            "cityName":""
	        }
	        """;

	        mockMvc.perform(post("/api/cities/add")
	                        .contentType(MediaType.APPLICATION_JSON)
	                        .content(json))
	                .andExpect(status().isBadRequest());
	    }

	    @Test
	    void should_fail_when_city_name_is_too_short() throws Exception {

	        String json = """
	        {
	            "cityName":"A"
	        }
	        """;

	        mockMvc.perform(post("/api/cities/add")
	                        .contentType(MediaType.APPLICATION_JSON)
	                        .content(json))
	                .andExpect(status().isBadRequest());
	    }

}
